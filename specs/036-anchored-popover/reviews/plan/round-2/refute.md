# Squad round 2 — Refute

| ID | Verdict | Kind | Decision | Reason |
| --- | --- | --- | --- | --- |
| PLAN-FRESH-2-001 | confirmed | fix | - | The independent Chromium probe cleared the editable input and left the populated readonly input unchanged and focused. The pinned WebKit source also sends nonmutable fields to the base key handler. Formulate the exception around the native clearing action and test the readonly stop's first Escape and trigger focus alongside editable clear then close. |
| PLAN-FRESH-2-002 | confirmed | fix | - | The strict server binds only to host loopback. An ordinary container gives that address a separate interface. Document and preflight host networking on Linux with the fixture listener in the Docker host namespace. Check fixture reachability and the exact CSP from the runner before the browser checks. |
| PLAN-FRESH-2-003 | confirmed | fix | - | An independent trusted capture probe reported the outside capture owner in the release path while a hit test at the release coordinates reached the inside button. Classify a retargeted release from its viewport hit and flat containment, and add a captured cross-boundary case alongside native outside activation. |

## Independent checks

Chromium 156.0.8078.4 left the readonly search value and focus intact on Escape while clearing the editable input. In a second probe, actual mouse down on an external button established pointer capture. Actual pointerup over a button in the popover still named the external capture owner in its composed path. Hit testing the event coordinates found the internal button.

The existing server constructs its fixture origin from `127.0.0.1` in the listener namespace. Docker's Linux host driver shares that namespace when the fixture starts on the Docker host. All three fixes preserve the accepted behavior. [WebKit search handling](https://github.com/WebKit/WebKit/blob/2bee8872e3b9fb535e1c062b5ac8be2ac12204ca/Source/WebCore/html/SearchInputType.cpp#L140-L154) · [Docker host networking](https://docs.docker.com/engine/network/drivers/host/) · [Pointer Events dispatch](https://www.w3.org/TR/pointerevents3/#firing-events-using-the-pointerevent-interface)
