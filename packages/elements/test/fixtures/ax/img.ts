// A recorded Accessibility.getFullAXTree node list for the reading rule "an img's name taken and its descendants not visited" (specs/010-feedback-forms T001,
// research.md R-09, contracts/testing.md § Live-region capture). Chromium 153.0.8010.12 (Playwright's build 1243, launched
// through OCELLE_CHROMIUM_PATH), recorded on 2026-11-14 by a throwaway Playwright script (not committed) that set a
// page's content to the planted markup below, enabled Accessibility on a CDP session and wrote the full tree verbatim:
//   <!doctype html><html lang="en"><body><main id="c"><div aria-live="polite">Disk <img alt="full" src="data:,"> <span role="img" aria-label="Star"><b>inner</b></span> now</div></main></body></html>
// Committed with the phase 1 red commit and never replaced or edited afterwards; T002 re-records the same markup with
// the capture and compares field by field (analysis I6).
import type { AxRecord } from "../../live-reading.ts";

export const img: readonly AxRecord[] = [
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
    "frameId": "5C338F59CC9E7A16FFF81AED4219D835"
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
      "6"
    ],
    "backendDOMNodeId": 5
  },
  {
    "nodeId": "6",
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
      "13",
      "7",
      "14",
      "11",
      "16"
    ],
    "backendDOMNodeId": 6
  },
  {
    "nodeId": "13",
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
      "value": "Disk ",
      "sources": [
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": "Disk "
          }
        }
      ]
    },
    "properties": [],
    "parentId": "6",
    "childIds": [
      "-1000000002"
    ],
    "backendDOMNodeId": 13
  },
  {
    "nodeId": "7",
    "ignored": false,
    "role": {
      "type": "role",
      "value": "image"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 99
    },
    "name": {
      "type": "computedString",
      "value": "full",
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
          "value": {
            "type": "computedString",
            "value": "full"
          },
          "attribute": "alt",
          "attributeValue": {
            "type": "string",
            "value": "full"
          }
        },
        {
          "type": "attribute",
          "attribute": "title",
          "superseded": true
        }
      ]
    },
    "properties": [
      {
        "name": "url",
        "value": {
          "type": "string",
          "value": "data:,"
        }
      }
    ],
    "parentId": "6",
    "childIds": [],
    "backendDOMNodeId": 7
  },
  {
    "nodeId": "14",
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
      "value": " ",
      "sources": [
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": " "
          }
        }
      ]
    },
    "properties": [],
    "parentId": "6",
    "childIds": [
      "-1000000003"
    ],
    "backendDOMNodeId": 14
  },
  {
    "nodeId": "11",
    "ignored": false,
    "role": {
      "type": "role",
      "value": "image"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 99
    },
    "name": {
      "type": "computedString",
      "value": "Star",
      "sources": [
        {
          "type": "relatedElement",
          "attribute": "aria-labelledby"
        },
        {
          "type": "attribute",
          "value": {
            "type": "computedString",
            "value": "Star"
          },
          "attribute": "aria-label",
          "attributeValue": {
            "type": "string",
            "value": "Star"
          }
        },
        {
          "type": "attribute",
          "attribute": "title",
          "superseded": true
        }
      ]
    },
    "properties": [],
    "parentId": "6",
    "childIds": [
      "15"
    ],
    "backendDOMNodeId": 11
  },
  {
    "nodeId": "16",
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
      "value": " now",
      "sources": [
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": " now"
          }
        }
      ]
    },
    "properties": [],
    "parentId": "6",
    "childIds": [
      "-1000000005"
    ],
    "backendDOMNodeId": 16
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
      "value": "Disk "
    },
    "properties": [],
    "parentId": "13",
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
      "value": " "
    },
    "properties": [],
    "parentId": "14",
    "childIds": []
  },
  {
    "nodeId": "15",
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
      "value": "inner",
      "sources": [
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": "inner"
          }
        }
      ]
    },
    "properties": [],
    "parentId": "11",
    "childIds": [
      "-1000000004"
    ],
    "backendDOMNodeId": 15
  },
  {
    "nodeId": "-1000000005",
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
      "value": " now"
    },
    "properties": [],
    "parentId": "16",
    "childIds": []
  },
  {
    "nodeId": "-1000000004",
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
      "value": "inner"
    },
    "properties": [],
    "parentId": "15",
    "childIds": []
  }
];
