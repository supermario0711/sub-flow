# A2UI Renderer Reference

> Research reference for building a custom React/Next.js A2UI renderer for Sub-Flow.

## Overview

A2UI (Agent to UI) is a declarative protocol by Google that enables AI agents to generate rich, interactive UIs rendered natively across platforms — without executing arbitrary code. The agent sends JSON component descriptions; the client renders them using its own native widgets.

- **Current version**: v0.8 (stable), v0.9 (draft)
- **License**: Apache 2.0
- **Official site**: [a2ui.org](https://a2ui.org/)
- **GitHub**: [google/A2UI](https://github.com/google/A2UI)
- **Spec**: [v0.8 specification](https://a2ui.org/specification/v0.8-a2ui/)
- **Renderer guide**: [a2ui.org/guides/renderer-development](https://a2ui.org/guides/renderer-development/)

### Design Principles

- **Security**: Declarative data, not executable code. Agents can only use pre-approved components from a catalog.
- **LLM-optimized**: Flat, streaming JSON (adjacency list) is easy for models to generate incrementally.
- **Framework-agnostic**: One agent response works across Angular, Flutter, React, etc.
- **Progressive enhancement**: UI streams as it is generated.

## Protocol Architecture

```
Agent (LLM) → A2UI JSON (JSONL over SSE) → Client Parser → Renderer → Native Components
User interaction → userAction payload → Agent
```

Transport: JSON Lines (JSONL) streamed over Server-Sent Events (SSE) for server-to-client. Client-to-server events use separate messages (A2A or custom endpoint).

## Message Types

### Server → Client

#### 1. `surfaceUpdate`

Delivers component definitions to a surface (UI region).

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "component": {
          "Column": {
            "children": { "explicitList": ["heading", "content"] }
          }
        }
      },
      {
        "id": "heading",
        "component": {
          "Text": {
            "text": { "literalString": "Welcome" },
            "usageHint": "h1"
          }
        }
      },
      {
        "id": "content",
        "component": {
          "Text": {
            "text": { "path": "/user/greeting" }
          }
        }
      }
    ]
  }
}
```

- `surfaceId` — targets a UI region
- `components` — flat array (adjacency list), each with unique `id` and exactly one component type key

#### 2. `dataModelUpdate`

Modifies the data model for a surface. Components bind to paths in this model.

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "path": "/user",
    "contents": [
      { "key": "greeting", "valueString": "Hello, Alice!" },
      { "key": "itemCount", "valueNumber": 3 },
      { "key": "isPremium", "valueBoolean": true }
    ]
  }
}
```

Value types: `valueString`, `valueNumber`, `valueBoolean`, `valueMap`, `valueArray`.

#### 3. `beginRendering`

Signals the client to render. Prevents incomplete UI flashes.

```json
{
  "beginRendering": {
    "surfaceId": "main",
    "root": "root",
    "catalogId": "https://a2ui.org/specification/v0_8/standard_catalog_definition.json"
  }
}
```

- `root` — component ID to start tree traversal from
- `catalogId` — optional, defaults to standard catalog

#### 4. `deleteSurface`

Removes a surface and all its components.

```json
{
  "deleteSurface": {
    "surfaceId": "main"
  }
}
```

### Client → Server

#### 1. `userAction`

Sent when a user interacts with a component that has an `action` defined.

```json
{
  "userAction": {
    "name": "submit_form",
    "surfaceId": "main",
    "sourceComponentId": "submit-btn",
    "timestamp": "2026-01-31T12:00:00Z",
    "context": {
      "userInput": "resolved-value-from-data-model",
      "formId": "f-123"
    }
  }
}
```

The `context` is resolved by the client from `action.context` BoundValues against the data model.

#### 2. `error`

Reports client-side errors (rendering failures, binding errors).

```json
{
  "error": { "message": "Component 'xyz' not found in registry" }
}
```

## Adjacency List Model

Components are a **flat list** with ID-based parent-child references. The client stores them in a `Map<string, Component>` and reconstructs the tree at render time.

This is LLM-friendly: generating a flat list piece-by-piece is easier than producing a perfectly nested JSON tree.

```json
[
  { "id": "root", "component": { "Column": { "children": { "explicitList": ["a", "b"] } } } },
  { "id": "a", "component": { "Text": { "text": { "literalString": "First" } } } },
  { "id": "b", "component": { "Text": { "text": { "literalString": "Second" } } } }
]
```

### Children Patterns

**Static children** — `explicitList`:
```json
{ "children": { "explicitList": ["child-1", "child-2"] } }
```

**Dynamic children** — `template` (data-bound list rendering):
```json
{
  "children": {
    "template": {
      "dataBinding": "/items",
      "componentId": "item-template"
    }
  }
}
```
The client iterates over the array at `/items` and renders the template component for each entry.

## Data Binding — `BoundValue`

Properties bind to data via `BoundValue` objects:

| Pattern | Example | Behavior |
|---|---|---|
| Literal only | `{ "literalString": "Hello" }` | Static value |
| Path only | `{ "path": "/user/name" }` | Resolves from data model |
| Path + literal | `{ "path": "/form/field", "literalString": "default" }` | Sets default in data model, then binds |

Literal types: `literalString`, `literalNumber`, `literalBoolean`, `literalArray`.

Path format follows JSON Pointer (RFC 6901): `/user/name`, `/cart/items`.

## Actions

Components can define an `action` that fires on interaction:

```json
{
  "id": "submit-btn",
  "component": {
    "Button": {
      "children": { "explicitList": ["submit-label"] },
      "primary": true,
      "action": {
        "name": "submit_form",
        "context": [
          { "key": "userInput", "value": { "path": "/form/field" } },
          { "key": "formId", "value": { "literalString": "f-123" } }
        ]
      }
    }
  }
}
```

On click, the client resolves all `value` BoundValues against the data model and sends a `userAction`.

## Standard Component Catalog

### Layout

| Component | Purpose | Key Properties |
|---|---|---|
| **Row** | Horizontal flex container | `children`, `distribution` (justify-content), `alignment` (align-items), child `weight` |
| **Column** | Vertical flex container | `children`, `distribution`, `alignment`, child `weight` |
| **List** | Scrollable list | `children`, `direction` (horizontal/vertical), `alignment` |

### Containers

| Component | Purpose | Key Properties |
|---|---|---|
| **Card** | Visual grouping (border/shadow) | `child` or `children` |
| **Tabs** | Tab set | `tabItems` (each with `title` and `child`) |
| **Modal** | Dialog overlay | `entryPointChild`, `contentChild` |

### Display

| Component | Purpose | Key Properties |
|---|---|---|
| **Text** | Text content | `text` (BoundValue), `usageHint` (h1-h5, body, caption) |
| **Image** | Image display | `url`, `fit` (cover, contain), `usageHint` (avatar, hero) |
| **Icon** | Predefined icon | Icon name from catalog |
| **Video** | Video player | URL |
| **AudioPlayer** | Audio player | URL, description |
| **Divider** | Visual separator | `axis` (horizontal, vertical) |

### Interactive

| Component | Purpose | Key Properties |
|---|---|---|
| **Button** | Clickable action trigger | `children`, `primary`, `action` |
| **TextField** | Text input | `label`, `text` (BoundValue), `textFieldType` (shortText, longText, number, obscured, date), `validationRegexp` |
| **CheckBox** | Boolean toggle | BoundValue for checked state |
| **DateTimeInput** | Date/time picker | `enableDate`, `enableTime` |
| **MultipleChoice** | Selection input | `maxAllowedSelections`, bound selections |
| **Slider** | Numeric range | `minValue`, `maxValue` |

## Rendering Flow

1. Client opens SSE stream to agent
2. Buffer incoming `surfaceUpdate` messages — store components in `Map<string, Component>` by ID
3. Buffer incoming `dataModelUpdate` messages — build/update data model
4. On `beginRendering` — start rendering from `root` component ID:
   a. Traverse from root, resolve child IDs recursively
   b. Resolve all `BoundValue` properties against data model
   c. Map each component type to a native React component via registry
   d. Render the tree
5. On user interaction — construct `userAction` with resolved context, send to agent
6. Agent responds with new updates — repeat from step 2

## React / DaisyUI Mapping

| A2UI Component | Our Implementation |
|---|---|
| Column | `<div className="flex flex-col">` |
| Row | `<div className="flex flex-row">` |
| List | `<div className="flex overflow-auto">` |
| Card | DaisyUI `<div className="card">` |
| Tabs | DaisyUI tabs |
| Modal | DaisyUI modal |
| Text | `<p>`, `<h1>`-`<h5>` based on `usageHint` |
| Image | Next.js `<Image>` |
| Button | DaisyUI `<button className="btn">` |
| TextField | DaisyUI `<input className="input">` |
| CheckBox | DaisyUI `<input className="checkbox">` |
| Slider | DaisyUI `<input className="range">` |
| Divider | DaisyUI `<div className="divider">` |

## Client Capabilities Declaration

In every message to the agent, include:

```json
{
  "a2uiClientCapabilities": {
    "supportedCatalogIds": [
      "https://a2ui.org/specification/v0_8/standard_catalog_definition.json"
    ]
  }
}
```

## Key Implementation Modules

| Module | Responsibility |
|---|---|
| **JSONL Parser** | Read SSE stream line-by-line, decode each as JSON |
| **Message Dispatcher** | Route by message type to handlers |
| **Surface Store** | `Map<string, Component>` per surface + data model |
| **Binding Resolver** | Evaluate `BoundValue` paths against data model |
| **Component Registry** | Map type strings → React components |
| **Tree Builder** | Reconstruct component tree from adjacency list |
| **Action Handler** | Construct and send `userAction` payloads |
