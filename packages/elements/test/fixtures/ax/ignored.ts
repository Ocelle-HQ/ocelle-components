// A recorded Accessibility.getFullAXTree node list for the reading rule "an ignored subtree contributes nothing" (specs/010-feedback-forms T001,
// research.md R-09, contracts/testing.md § Live-region capture). Chromium 153.0.8010.12 (Playwright's build 1243, launched
// through OCELLE_CHROMIUM_PATH), recorded on 2026-11-14 by a throwaway Playwright script (not committed) that set a
// page's content to the planted markup below, enabled Accessibility on a CDP session and wrote the full tree verbatim:
//   <!doctype html><html lang="en"><body><main id="c"><button aria-describedby="gone hid">Go</button><div aria-live="polite">Kept <span aria-hidden="true" id="gone">Gone</span> <span hidden id="hid">Hidden</span></div></main></body></html>
// Committed with the phase 1 red commit and never replaced or edited afterwards; T002 re-records the same markup with
// the capture and compares field by field (analysis I6).
import type { AxRecord } from "../../live-reading.ts";

export const ignored: readonly AxRecord[] = [
  {
    "nodeId": "1",
    "ignored": false,
    "role": {
      "type": "internalRole",
      "value": "RootWebArea"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 144
    },
    "name": {
      "type": "computedString",
      "value": "",
      "sources": [
        {
          "type": "relatedElement",
          "attribute": "aria-labelledby"
        },
        {
          "type": "attribute",
          "attribute": "aria-label"
        },
        {
          "type": "attribute",
          "attribute": "aria-label",
          "superseded": true
        },
        {
          "type": "relatedElement",
          "nativeSource": "title"
        }
      ]
    },
    "properties": [
      {
        "name": "focusable",
        "value": {
          "type": "booleanOrUndefined",
          "value": true
        }
      },
      {
        "name": "focused",
        "value": {
          "type": "booleanOrUndefined",
          "value": true
        }
      },
      {
        "name": "url",
        "value": {
          "type": "string",
          "value": "about:blank"
        }
      }
    ],
    "childIds": [
      "2"
    ],
    "backendDOMNodeId": 1,
    "frameId": "545384F179C5BFC3DFB7C3DF045C2D74"
  },
  {
    "nodeId": "2",
    "ignored": true,
    "ignoredReasons": [
      {
        "name": "uninteresting",
        "value": {
          "type": "boolean",
          "value": true
        }
      }
    ],
    "role": {
      "type": "role",
      "value": "none"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 0
    },
    "parentId": "1",
    "childIds": [
      "4"
    ],
    "backendDOMNodeId": 2
  },
  {
    "nodeId": "4",
    "ignored": true,
    "ignoredReasons": [
      {
        "name": "uninteresting",
        "value": {
          "type": "boolean",
          "value": true
        }
      }
    ],
    "role": {
      "type": "role",
      "value": "none"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 0
    },
    "parentId": "2",
    "childIds": [
      "5"
    ],
    "backendDOMNodeId": 4
  },
  {
    "nodeId": "5",
    "ignored": false,
    "role": {
      "type": "role",
      "value": "main"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 118
    },
    "name": {
      "type": "computedString",
      "value": "",
      "sources": [
        {
          "type": "relatedElement",
          "attribute": "aria-labelledby"
        },
        {
          "type": "attribute",
          "attribute": "aria-label"
        },
        {
          "type": "attribute",
          "attribute": "title"
        }
      ]
    },
    "properties": [],
    "parentId": "4",
    "childIds": [
      "6",
      "7"
    ],
    "backendDOMNodeId": 5
  },
  {
    "nodeId": "6",
    "ignored": false,
    "role": {
      "type": "role",
      "value": "button"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 9
    },
    "name": {
      "type": "computedString",
      "value": "Go",
      "sources": [
        {
          "type": "relatedElement",
          "attribute": "aria-labelledby"
        },
        {
          "type": "attribute",
          "attribute": "aria-label"
        },
        {
          "type": "relatedElement",
          "nativeSource": "label"
        },
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": "Go"
          }
        },
        {
          "type": "attribute",
          "attribute": "title",
          "superseded": true
        }
      ]
    },
    "description": {
      "type": "computedString",
      "value": "Gone Hidden"
    },
    "properties": [
      {
        "name": "invalid",
        "value": {
          "type": "token",
          "value": "false"
        }
      },
      {
        "name": "focusable",
        "value": {
          "type": "booleanOrUndefined",
          "value": true
        }
      },
      {
        "name": "describedby",
        "value": {
          "type": "idrefList",
          "value": "gone hid",
          "relatedNodes": [
            {
              "backendDOMNodeId": 8,
              "idref": "gone"
            },
            {
              "backendDOMNodeId": 9,
              "idref": "hid"
            }
          ]
        }
      }
    ],
    "parentId": "5",
    "childIds": [
      "10"
    ],
    "backendDOMNodeId": 6
  },
  {
    "nodeId": "7",
    "ignored": false,
    "role": {
      "type": "role",
      "value": "generic"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 88
    },
    "name": {
      "type": "computedString",
      "value": "",
      "sources": [
        {
          "type": "relatedElement",
          "attribute": "aria-labelledby"
        },
        {
          "type": "attribute",
          "attribute": "aria-label"
        }
      ]
    },
    "properties": [
      {
        "name": "live",
        "value": {
          "type": "token",
          "value": "polite"
        }
      },
      {
        "name": "atomic",
        "value": {
          "type": "boolean",
          "value": false
        }
      },
      {
        "name": "relevant",
        "value": {
          "type": "tokenList",
          "value": "additions text"
        }
      }
    ],
    "parentId": "5",
    "childIds": [
      "11",
      "8",
      "9"
    ],
    "backendDOMNodeId": 7
  },
  {
    "nodeId": "10",
    "ignored": false,
    "role": {
      "type": "internalRole",
      "value": "StaticText"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 158
    },
    "name": {
      "type": "computedString",
      "value": "Go",
      "sources": [
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": "Go"
          }
        }
      ]
    },
    "properties": [],
    "parentId": "6",
    "childIds": [
      "-1000000002"
    ],
    "backendDOMNodeId": 10
  },
  {
    "nodeId": "11",
    "ignored": false,
    "role": {
      "type": "internalRole",
      "value": "StaticText"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 158
    },
    "name": {
      "type": "computedString",
      "value": "Kept ",
      "sources": [
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": "Kept "
          }
        }
      ]
    },
    "properties": [],
    "parentId": "7",
    "childIds": [
      "-1000000003"
    ],
    "backendDOMNodeId": 11
  },
  {
    "nodeId": "8",
    "ignored": true,
    "ignoredReasons": [
      {
        "name": "ariaHiddenElement",
        "value": {
          "type": "boolean",
          "value": true
        }
      }
    ],
    "role": {
      "type": "role",
      "value": "none"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 0
    },
    "parentId": "7",
    "childIds": [
      "12"
    ],
    "backendDOMNodeId": 8
  },
  {
    "nodeId": "12",
    "ignored": true,
    "ignoredReasons": [
      {
        "name": "ariaHiddenSubtree",
        "value": {
          "type": "idref",
          "relatedNodes": [
            {
              "backendDOMNodeId": 8,
              "idref": "gone"
            }
          ]
        }
      }
    ],
    "role": {
      "type": "role",
      "value": "none"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 0
    },
    "parentId": "8",
    "childIds": [],
    "backendDOMNodeId": 12
  },
  {
    "nodeId": "9",
    "ignored": true,
    "ignoredReasons": [
      {
        "name": "notRendered",
        "value": {
          "type": "boolean",
          "value": true
        }
      }
    ],
    "role": {
      "type": "role",
      "value": "none"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 0
    },
    "parentId": "7",
    "childIds": [
      "13"
    ],
    "backendDOMNodeId": 9
  },
  {
    "nodeId": "13",
    "ignored": true,
    "ignoredReasons": [
      {
        "name": "notRendered",
        "value": {
          "type": "boolean",
          "value": true
        }
      }
    ],
    "role": {
      "type": "role",
      "value": "none"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 0
    },
    "parentId": "9",
    "childIds": [],
    "backendDOMNodeId": 13
  },
  {
    "nodeId": "-1000000002",
    "ignored": false,
    "role": {
      "type": "internalRole",
      "value": "InlineTextBox"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 101
    },
    "name": {
      "type": "computedString",
      "value": "Go"
    },
    "properties": [],
    "parentId": "10",
    "childIds": []
  },
  {
    "nodeId": "-1000000003",
    "ignored": false,
    "role": {
      "type": "internalRole",
      "value": "InlineTextBox"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 101
    },
    "name": {
      "type": "computedString",
      "value": "Kept "
    },
    "properties": [],
    "parentId": "11",
    "childIds": []
  }
];
