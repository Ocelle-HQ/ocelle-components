// A recorded Accessibility.getFullAXTree node list for the reading rule "a link's own name skipped and its StaticText children taken" (specs/010-feedback-forms T001,
// research.md R-09, contracts/testing.md § Live-region capture). Chromium 153.0.8010.12 (Playwright's build 1243, launched
// through OCELLE_CHROMIUM_PATH), recorded on 2026-11-14 by a throwaway Playwright script (not committed) that set a
// page's content to the planted markup below, enabled Accessibility on a CDP session and wrote the full tree verbatim:
//   <!doctype html><html lang="en"><body><main id="c"><div aria-live="polite">Open <a href="#report" aria-label="Report link">the report</a></div></main></body></html>
// Committed with the phase 1 red commit and never replaced or edited afterwards; T002 re-records the same markup with
// the capture and compares field by field (analysis I6).
import type { AxRecord } from "../../live-reading.ts";

export const link: readonly AxRecord[] = [
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
    "frameId": "3DA7A5594DAEA9C0D795C0C92443711E"
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
      "8",
      "7"
    ],
    "backendDOMNodeId": 6
  },
  {
    "nodeId": "8",
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
      "value": "Open ",
      "sources": [
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": "Open "
          }
        }
      ]
    },
    "properties": [],
    "parentId": "6",
    "childIds": [
      "-1000000002"
    ],
    "backendDOMNodeId": 8
  },
  {
    "nodeId": "7",
    "ignored": false,
    "role": {
      "type": "role",
      "value": "link"
    },
    "chromeRole": {
      "type": "internalRole",
      "value": 110
    },
    "name": {
      "type": "computedString",
      "value": "Report link",
      "sources": [
        {
          "type": "relatedElement",
          "attribute": "aria-labelledby"
        },
        {
          "type": "attribute",
          "value": {
            "type": "computedString",
            "value": "Report link"
          },
          "attribute": "aria-label",
          "attributeValue": {
            "type": "string",
            "value": "Report link"
          }
        },
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": "the report"
          },
          "superseded": true
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
        "name": "focusable",
        "value": {
          "type": "booleanOrUndefined",
          "value": true
        }
      },
      {
        "name": "url",
        "value": {
          "type": "string",
          "value": "about:blank#report"
        }
      }
    ],
    "parentId": "6",
    "childIds": [
      "9"
    ],
    "backendDOMNodeId": 7
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
      "value": "Open "
    },
    "properties": [],
    "parentId": "8",
    "childIds": []
  },
  {
    "nodeId": "9",
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
      "value": "the report",
      "sources": [
        {
          "type": "contents",
          "value": {
            "type": "computedString",
            "value": "the report"
          }
        }
      ]
    },
    "properties": [],
    "parentId": "7",
    "childIds": [
      "-1000000003"
    ],
    "backendDOMNodeId": 9
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
      "value": "the report"
    },
    "properties": [],
    "parentId": "9",
    "childIds": []
  }
];
