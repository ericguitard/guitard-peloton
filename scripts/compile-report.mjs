import fs from "node:fs";
import path from "node:path";
import { compile } from "@vue/compiler-dom";
const input = process.argv[2] ?? "docs/index.html";
const output = process.argv[3] ?? input;
// Official discipline SVGs from Peloton’s public design system. Kept local as
// static image data so icons do not depend on third-party requests or scripts.
// Sources: https://www.onepeloton.com/classes and https://www.breathwrk.com/
// (retrieved 2026-11-15). Breathwrk uses its official app brand mark.
const disciplineIcons = {"Strength":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJTdHJlbmd0aCI+U3RyZW5ndGg8L3RpdGxlPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTUuNjIxIDVjMCAxLjEwNS0uOTAzIDItMi4wMTcgMmEyLjAwOSAyLjAwOSAwIDAgMS0yLjAxOC0yYzAtMS4xMDUuOTAzLTIgMi4wMTgtMiAxLjExNCAwIDIuMDE4Ljg5NSAyLjAxOCAyWm02LjQ5MiAzLjQ3My0uMjAzLS4yMDFhLjQ1My40NTMgMCAwIDAtLjQ0NS0uMTE4bC0uNjY0LjItMS41MDQtMS40OS4yMDItLjY1OGEuNDQzLjQ0MyAwIDAgMC0uMTE4LS40NDJsLS4yMDQtLjIwMWMtLjE3NC0uMTczLS40NDctLjE4Mi0uNjEtLjAybC0xLjE5MyAxLjE4MmMtLjE2My4xNjItLjE1NC40MzMuMDIuNjA1bC4yMDMuMjAyYy4xMi4xMTguMjkyLjE2NC40NDYuMTE3bC42NjMtLjJMMjAuMjEgOC45NGwtLjIwMi42NThhLjQ0My40NDMgMCAwIDAgLjExOS40NDFsLjIwMy4yMDJjLjE3NC4xNzIuNDQ4LjE4MS42MTEuMDJsMS4xOTItMS4xODJjLjE2My0uMTYyLjE1NS0uNDMzLS4wMi0uNjA2Wm0tOC41MzctLjM4YTEuNTIyIDEuNTIyIDAgMCAwLTEuODgtLjQzNmMtLjU0OS4yNy0uODY5Ljg0LS44MyAxLjQzLjIwOCAzLjI0Ni4wNTIgNS4xMjUtLjM0OCA2LjM0Ni0uMzc0IDEuMTQ0LS45NzUgMS43NTUtMS44NzIgMi40MjFsLTYuNTEgMy42OThhLjc0Ljc0IDAgMCAwLS4zMDYuOTgzYy4xNS4yOTYuNDg3LjQ5LjY3Ny40NjIuMDgtLjAxMS4yNy0uMDk1LjM0Ni0uMTMzbDcuNjItMy43NTFjMS4xMTMtLjYzNiAyLjEwNy0xLjU4IDIuNzYtMy4xNDguNDgtMS4xNTYuNzM1LTIuNjkxLjcyLTQuODkzbC43MTQuOTM3Yy40Ni42MDUgMS4zNTguNjY4IDEuOS4xMzNsMi4xMTEtMi4wNzhhLjczNy43MzcgMCAwIDAgMC0xLjA1NC43NjUuNzY1IDAgMCAwLTEuMDcgMGwtMS45MDUgMS44NzYtMi4xMjctMi43OTJabS43NzcgOC42ODkgMi43ODItLjI2MmEuMjUuMjUgMCAwIDEgLjI1Mi4yNDl2NS40ODFjMCAuNDEzLjMzOS43NDcuNzU2Ljc0N2EuNzUyLjc1MiAwIDAgMCAuNzU3LS43NDd2LTUuNzNjMC0uOTYzLS43OS0xLjc0NC0xLjc2NS0xLjc0NEgxNS4xM2MtLjEwNS40NS0uMjM0Ljg1Mi0uMzg1IDEuMjE3LS4xMi4yODgtLjI1MS41NDktLjM5My43ODlaIiBmaWxsPSIjMTgxQTFEIj48L3BhdGg+PC9zdmc+","Cycling":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJDeWNsaW5nIj5DeWNsaW5nPC90aXRsZT48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyLjI1IDRhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0Wm01LjUxNSA2LjM1M2EuNzUuNzUgMCAwIDEgLjczNS0uNjAzSDIxYS43NS43NSAwIDAgMSAwIDEuNWgtMS44ODVsLS41NTggMi43ODlhNCA0IDAgMCAxIDIuNzUyIDYuMjFsMi40NzEgMi40N2EuNzUuNzUgMCAxIDEtMS4wNiAxLjA2MWwtMi40NzItMi40NzFhNCA0IDAgMSAxLTMuMjM3LTcuMTg2bC4wMDQtLjAyLjc1LTMuNzVaTTMuMTggMTkuMjYyYS43NTIuNzUyIDAgMCAxIC4wNjYtLjA2OEEzIDMgMCAwIDEgNC42NSAxNS4zMmwtLjYzNC0xLjlhLjI1LjI1IDAgMCAwLS4yMzctLjE3MUgyYS43NS43NSAwIDAgMSAwLTEuNWgxLjc4YTEuNzUgMS43NSAwIDAgMSAxLjY2IDEuMTk3bC42ODUgMi4wNTZhMyAzIDAgMSAxLTEuOTM3IDUuMzg4TDEuMzIgMjMuNzM4YS43NS43NSAwIDEgMS0xLjEzOC0uOTc2bDMtMy41Wk0yMC41IDE4YTIuNSAyLjUgMCAxIDEtNSAwIDIuNSAyLjUgMCAwIDEgNSAwWk02IDE5LjVhMS41IDEuNSAwIDEgMCAwLTMgMS41IDEuNSAwIDAgMCAwIDNabTYuMjU2LTMuMjI1djMuOTc5YS43NDcuNzQ3IDAgMCAxLS43NDguNzQ2Ljc0Ny43NDcgMCAwIDEtLjc0OS0uNzQ2di02LjFhLjI0OC4yNDggMCAwIDAtLjEzOC0uMjIybC0zLjM1My0xLjY3YTIuNzMgMi43MyAwIDAgMS0xLjAxLTQuMDNMOC45IDQuNTIzYy42MTItLjg2IDEuOTUyLS42MTcgMi4yMjMuNDAxbC45MyAzLjVoMi45NDdjLjQxNCAwIC43NDkuMzM0Ljc0OS43NDZhLjc0Ny43NDcgMCAwIDEtLjc0OS43NDZoLTMuNTIzYS43NDguNzQ4IDAgMCAxLS43MjMtLjU1NWwtLjU1Mi0yLjA3Ny0xLjg0IDIuNzQ4IDMuMjQ4IDIuNjNjLjQwOC4zMy42NDUuODI2LjY0NSAxLjM1djIuMjYyWk0xOC4xMSAzLjc1Yy0uNDQ3IDAtLjg0NS4yNTItLjk5NC42MjhMMTYuMDMgNy42MjNjLS4xMjIuMzA2LjEzMy42MjcuNDk3LjYyN2g1LjM2MmMuNDQ3IDAgLjg0NS0uMjUyLjk5NC0uNjI4bDEuMDg1LTMuMjQ1Yy4xMjItLjMwNi0uMTMzLS42MjctLjQ5Ny0uNjI3SDE4LjExWiIgZmlsbD0iIzE4MUExRCI+PC9wYXRoPjwvc3ZnPg==","Meditation":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJNZWRpdGF0aW9uIj5NZWRpdGF0aW9uPC90aXRsZT48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyIDcuNzVhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0Wm0tLjg0NC44NzRjLS4xNS4wMzktLjI5My4wOTctLjQyOC4xNzNsLS4wNjMuMDMyYS43NDguNzQ4IDAgMCAwLS4yMy4xNzcgMS43NTEgMS43NTEgMCAwIDAtLjIzMS4yNDlMOC40NCAxMS41NTcgNS4yNzQgMTIuNTZhLjc1Ljc1IDAgMCAwIC40NTIgMS40M2wzLjM5Mi0xLjA3M2EuNzUuNzUgMCAwIDAgLjM2OS0uMjU5bC44MTYtMS4wNjYuMDg0IDMuMjY4LTMuNDkyLjk5NWMtMS4xOTIuMzM5LTEuMjE3IDIuMDItLjAzNSAyLjM5M2wuOTE0LjI5TDEwIDE3Ljc1bC0xLjg5NS0uNjgyIDMuNjExLS43ODdhMS4zMzUgMS4zMzUgMCAwIDEgLjU2OCAwbDMuNjEuNzg3TDguMSAxOS41MzVhLjc1Ljc1IDAgMSAwIC40NTIgMS40M0wxMiAxOS44NzRsMy40NDggMS4wOTFhLjc1Ljc1IDAgMCAwIC40NTItMS40M2wtMS40MTQtLjQ0OCAyLjY1NC0uODRjMS4xODItLjM3MyAxLjE1Ny0yLjA1NC0uMDM1LTIuMzkzbC0zLjQ5Mi0uOTk1LjA4My0zLjI0OS44MjIgMS4wNTNhLjc1Ljc1IDAgMCAwIC4zNjQuMjUzbDMuMzkyIDEuMDczYS43NS43NSAwIDEgMCAuNDUyLTEuNDNsLTMuMTctMS4wMDNMMTMuNjQgOS4xYTEuMTMgMS4xMyAwIDAgMC0uMDI3LS4wMzMuNzUxLjc1MSAwIDAgMC0uMzEtLjI1MyAyLjgzIDIuODMgMCAwIDAtMi4xNDYtLjE5Wm05LjkzMSAxMC4yMDJhLjc1Ljc1IDAgMCAxIDEuMDAzLjM0NWwxLjgzNCAzLjc1QS43NS43NSAwIDAgMSAyMy4yNSAyNEguNzVhLjc1Ljc1IDAgMCAxLS42NzQtMS4wOGwxLjgzNC0zLjc1YS43NS43NSAwIDAgMSAxLjM0Ny42NkwxLjk1MSAyMi41SDIyLjA1bC0xLjMwNi0yLjY3YS43NS43NSAwIDAgMSAuMzQ0LTEuMDA0WiIgZmlsbD0iIzE4MUExRCI+PC9wYXRoPjwvc3ZnPg==","Walking":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJXYWxraW5nIj5XYWxraW5nPC90aXRsZT48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE1IDVhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0Wm0tMi42MDYuMzRhLjc0OS43NDkgMCAwIDEgLjM2LS4wOSAxLjkgMS45IDAgMCAxIDEuODI3IDIuNDA5bC0xLjU1MyA1LjU5IDEuOTUgMi42NzIuMDM0LjAzYS43NS43NSAwIDAgMSAuMjM4LjU0OXY1Ljc1YS43NS43NSAwIDAgMS0xLjUgMHYtNS40MjRsLTMuMDY1LTIuODZhMS43NSAxLjc1IDAgMCAxLS40ODgtMS43NmwxLjM0NC00LjcwMy0xLjQyNC43NjYtLjkwNiAyLjcxOGEuNzUuNzUgMCAwIDEtMS40MjMtLjQ3NGwxLTNhLjc1Ljc1IDAgMCAxIC4zNTYtLjQyM2wzLjI1LTEuNzVaTTkuNzUgMTUgMTEgMTYuMjVsLS43OTcgMS43NzEtMi4yODIgNC41NjRhLjc1Ljc1IDAgMSAxLTEuMzQyLS42N2wyLjIxOC00LjQzNkw5Ljc1IDE1Wm03LjczNy0zLjQ2MS0yLjIxMS0uNzM4LS40NzUgMS40MjMgMi4yMTIuNzM3YS43NS43NSAwIDAgMCAuNDc0LTEuNDIyWiIgZmlsbD0iIzE4MUExRCI+PC9wYXRoPjwvc3ZnPg==","Running":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJSdW5uaW5nIj5SdW5uaW5nPC90aXRsZT48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE2LjUgNWEyIDIgMCAxIDAgMC00IDIgMiAwIDAgMCAwIDRabS01LjI1IDEwLjUtMS41LTFMOC41MjQgMTdIMy43NWEuNzUuNzUgMCAwIDAgMCAxLjVIOWEuNzUuNzUgMCAwIDAgLjY3OS0uNDMxTDExLjI1IDE1LjVabTQuNDY0LTQuNzVoMy4wMzZhLjc1Ljc1IDAgMCAwIDAtMS41aC0yLjM5M2wtLjY0MyAxLjVabS0xLjg3Ny01LjQ4MmEuNzQ5Ljc0OSAwIDAgMSAuMTcxLS4wMTggMS42OTMgMS42OTMgMCAwIDEgMS41NjQgMi4zMjFsLTIuMDY4IDUuMTY5IDMuMTk0IDMuMTU4YS43NS43NSAwIDAgMSAuMy41MzdsLjUgNS43NWEuNzUuNzUgMCAxIDEtMS40OTUuMTNsLS40Ny01LjQwMS00LjA2OC0yLjg0OGExLjc1IDEuNzUgMCAwIDEtLjYyNS0yLjA3M2wxLjk0Ni00Ljk1NS0yLjY4OC41OTctLjg3NyAzLjA3MWEuNzUuNzUgMCAwIDEtMS40NDItLjQxMmwxLTMuNWEuNzUuNzUgMCAwIDEgLjU1OC0uNTI2bDQuNS0xWiIgZmlsbD0iIzE4MUExRCI+PC9wYXRoPjwvc3ZnPg==","Stretching":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJTdHJldGNoaW5nIj5TdHJldGNoaW5nPC90aXRsZT48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0ibTcuNSAyMSAuNDktNy4wOTlhLjE2My4xNjMgMCAwIDEgLjMwNi0uMDY0bDIuNTY3IDQuODg5IDEuNzAyIDMuODI5YS43NS43NSAwIDEgMCAxLjM3LS42MWwtMy41MS03Ljk3OGMtLjI3OC0uNjM0LS40MTMtMS4zMzUtLjI1Mi0yLjAwOS4yMzMtLjk3OC43MDQtMi4wMTcgMS42Ny0yLjc2OGwyLjA3NCAyLjgyOS0xLjk4NS0uNDk3YS43NS43NSAwIDAgMC0uMzY0IDEuNDU2bDMuMzI5LjgzMmMuOTA4LjIyNyAxLjYwMi0uODA3IDEuMDQ4LTEuNTYyTDExLjE4NyA1Ljc2QTEwLjQ1OSAxMC40NTkgMCAwIDEgMTggMy4yNWgxYS43NS43NSAwIDAgMCAwLTEuNWgtMWMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnY4LjVhLjc1Ljc1IDAgMCAwIDEuNSAwVjIxWm04LjI1LTEyYTIgMiAwIDEgMCAwLTQgMiAyIDAgMCAwIDAgNFoiIGZpbGw9IiMxODFBMUQiPjwvcGF0aD48L3N2Zz4=","Yoga":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJZb2dhIj5Zb2dhPC90aXRsZT48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE3IDNhMiAyIDAgMSAxLTQgMCAyIDIgMCAwIDEgNCAwWk04Ljc1IDE0bDEuNzUgMS01LjM3MyA3LjY2MmEuNzUuNzUgMCAwIDEtMS4yNTQtLjgyNEw4Ljc1IDE0Wk0yMSA1Ljc1SDZhLjc1Ljc1IDAgMCAwIDAgMS41aDUuMTc1bC0xLjg0MSAzLjA3YTEuNzUgMS43NSAwIDAgMCAuNDg4IDIuMzI4bDUuODIzIDQuMTNhLjI1LjI1IDAgMCAxIC4xMDUuMTk3djUuMjc1YS43NS43NSAwIDEgMCAxLjUgMHYtNS41NDJhMS43NSAxLjc1IDAgMCAwLS42MDYtMS4zMjVsLTMuOTgzLTMuNDQgMi45MzMtNC42OTNIMjFhLjc1Ljc1IDAgMCAwIDAtMS41WiIgZmlsbD0iIzE4MUExRCI+PC9wYXRoPjwvc3ZnPg==","Bike Bootcamp":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJCaWtlQm9vdGNhbXAiPkJpa2UgQm9vdGNhbXA8L3RpdGxlPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNOC43NSAzYTIgMiAwIDEgMS00IDAgMiAyIDAgMCAxIDQgMFptMi42MzMtLjVjLjg3IDAgMS42MDkuNjQgMS43MzIgMS41MDNsLjM3NyAyLjY0YS43NS43NSAwIDAgMS0uNzQyLjg1N2wtMy42NDQuMzA0LS4yMDMgMS4yMTZhMTIuMDE3IDEyLjAxNyAwIDAgMC0uMTYzIDEuOTczdi41ODRjMCAuODk2LjI2NiAxLjc5LjUyNiAyLjY2Mi4wNi4yLjExOC4zOTguMTc0LjU5NWwyLjAyNiA3LjE5NWEuNzUuNzUgMCAwIDEtMS40MzEuNDQybC0yLjk5LTguMjY0YS4zMTQuMzE0IDAgMCAwLS41OSAwbC0yLjk5IDguMjY0YS43NDkuNzQ5IDAgMSAxLTEuNDMyLS40NDJsMi4wMTMtNy4xNDhjLjA1Ni0uMTk3LjExNS0uMzk2LjE3NS0uNTk1LjI2LS44NzMuNTI1LTEuNzY2LjUyNS0yLjY2M3YtLjYzYzAtLjY2LS4wNTQtMS4zMi0uMTYzLTEuOTczbC0uMjAyLTEuMjE3TC43NSA3LjVhLjc1Ljc1IDAgMCAxLS43NDItLjg1NmwuMzc3LTIuNjQxQTEuNzUgMS43NSAwIDAgMSAyLjExNyAyLjVoLjEzM2EuNzUuNzUgMCAxIDEgMCAxLjVoLS4xMzNhLjI1LjI1IDAgMCAwLS4yNDcuMjE1TDEuNjE1IDZoMTAuMjdsLS4yNTUtMS43ODVBLjI1LjI1IDAgMCAwIDExLjM4MyA0aC0uMTMzYS43NS43NSAwIDAgMSAwLTEuNWguMTMzWm01LjczMyAxLjEyOGMuMTQ5LS4zNzYuNTQ3LS42MjguOTk0LS42MjhoNS4zNjJjLjM2NCAwIC42MTkuMzIxLjQ5Ny42MjdsLTEuMDg1IDMuMjQ1Yy0uMTQ5LjM3Ni0uNTQ3LjYyOC0uOTk0LjYyOGgtNS4zNjJjLS4zNjQgMC0uNjE5LS4zMjEtLjQ5Ny0uNjI3bDEuMDg1LTMuMjQ1Wk0xOS43NSA5LjAydjIuNDhhLjc1Ljc1IDAgMCAxLS4yNDEuNTUxbC02LjUgNmEuNzUuNzUgMCAxIDEtMS4wMTgtMS4xMDJsMi42ODItMi40NzUtMS4xNjgtMi43MjRIMTJhLjc1Ljc1IDAgMCAxIDAtMS41aDJjLjMgMCAuNTcxLjE3OS42OS40NTVsMS4xNTIgMi42OSAyLjQwOC0yLjIyM1Y5LjAyaDEuNVpNMjEuNSAxOGEyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDBabTEuNSAwYTMuNSAzLjUgMCAxIDEtNyAwIDMuNSAzLjUgMCAwIDEgNyAwWiIgZmlsbD0iIzE4MUExRCI+PC9wYXRoPjwvc3ZnPg==","Cardio":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJDYXJkaW8iPkNhcmRpbzwvdGl0bGU+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01IDYuMjVhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0Wm0yLjg4NC0uOTQ1QTIuNzUgMi43NSAwIDAgMSA5LjgyOCA0LjVIMTNhLjc1Ljc1IDAgMCAxIC42NyAxLjA4NWwtMSAyYS43NS43NSAwIDEgMS0xLjM0LS42N0wxMS43ODYgNkg5LjgyOGMtLjMzMSAwLS42NDkuMTMyLS44ODMuMzY2bC0uMDQuMDQgMS45NSAxLjk1YTMgMyAwIDAgMCAzLjE5LjY4Mmw3LjE4OC0yLjczOWEuNzUuNzUgMCAxIDEgLjUzNCAxLjQwMmwtOC4yOTIgMy43NWEyLjIwMyAyLjIwMyAwIDAgMC0xLjI4NCAxLjc5OWwtLjQ0MSA5LjI1YS43NS43NSAwIDAgMS0xLjUgMHYtOS44YS4yNS4yNSAwIDAgMC0uMDg0LS4xODhsLTMuODk0LTMuNDZhMi4yNSAyLjI1IDAgMCAwLS41MjIgMS40NFYxMkg4YS43NS43NSAwIDAgMSAwIDEuNUg1YS43NS43NSAwIDAgMS0uNzUtLjc1di0yLjI1N0EzLjc1IDMuNzUgMCAwIDEgNS4zNDggNy44NGwyLjUzNi0yLjUzNloiIGZpbGw9IiMxODFBMUQiPjwvcGF0aD48L3N2Zz4=","Rowing":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJSb3dpbmciPlJvd2luZzwvdGl0bGU+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik05LjI1IDdhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0Wm0tLjk5Ny42MzljLS4yMTctLjIzNS0uNjA3LS42NTItMS4yMTUtLjYzOWExLjU5MiAxLjU5MiAwIDAgMC0uNjg1LjE5IDUuNjUgNS42NSAwIDAgMC0uNTQ2LjMzQzMuNzgyIDguODYyIDIuNCAxMi4xODUgMy4yNiAxNS45MzQgMy40MSAxNi41NzkgNC4wMTYgMTcgNC42NzIgMTdhLjg3Mi44NzIgMCAwIDAgLjMzMi0uMDY2bDUuNjc3LTIuMzM4IDQuMTI5IDIuM2MuMzc2LjIxLjg2LjA5MSAxLjA4LS4yNjVhLjcyNi43MjYgMCAwIDAtLjI4LTEuMDI0bC00LjQ3NC0yLjQ5M2EuODI4LjgyOCAwIDAgMC0uNjY3LS4wNmwtNC40MDYuNzI2Yy4yMjgtMi4xNS45OTktMy45MDQgMS40NTYtNC42NjdsMS43MSAxLjg0YS44LjggMCAwIDAgLjQyNC4yMzZsMy4yNjguNjc1Yy40MjYuMDg4Ljg0Ny0uMTY4Ljk0LS41NzIuMDkyLS40MDMtLjE3OC0uODAyLS42MDQtLjg5bC0zLjAxNC0uNjIyLTEuOTktMi4xNDFabTExLjc2IDcuMTExIDEuNTU2IDEuODE2LTEuMjMgMS45MzRIMy44MDNhMS43NSAxLjc1IDAgMCAwLTEuNDg0LjgyM2wtMi4yMDYgMy41M2EuNzUuNzUgMCAxIDAgMS4yNzIuNzk0bDIuMjA2LTMuNTNBLjI1LjI1IDAgMCAxIDMuODA0IDIwaDE2LjUzbDIuMjggMy42NDhhLjc1Ljc1IDAgMCAwIDEuMjcyLS43OTZsLTIuMjUtMy41OTggMS4zOTctMi4xOTVhMSAxIDAgMCAwLS4wODQtMS4xODhsLS45NjEtMS4xMjFoLTEuOTc2Wk0xNy45NTYgOWExIDEgMCAwIDAtLjk0Mi42NjdsLTEuMDMgMi45MTdhLjUuNSAwIDAgMCAuNDcyLjY2Nmg1LjA4NWExIDEgMCAwIDAgLjk0My0uNjY3bDEuMDMtMi45MTdBLjUuNSAwIDAgMCAyMy4wNDMgOWgtNS4wODVaIiBmaWxsPSIjMTgxQTFEIj48L3BhdGg+PC9zdmc+","Row Bootcamp":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJSb3dpbmdCb290Y2FtcCI+Um93aW5nIEJvb3RjYW1wPC90aXRsZT48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTguNzUgM2EyIDIgMCAxIDEtNCAwIDIgMiAwIDAgMSA0IDBaTTQuMzggNy44MDNsLjIwMyAxLjIxN2MuMTA5LjY1Mi4xNjMgMS4zMTIuMTYzIDEuOTczdi42M2MwIC44OTctLjI2NiAxLjc5LS41MjUgMi42NjMtLjA2LjItLjExOS4zOTgtLjE3NS41OTVsLTIuMDEzIDcuMTQ4YS43NS43NSAwIDAgMCAxLjQzMi40NDJsMi45OS04LjI2NGEuMzE0LjMxNCAwIDAgMSAuNTkgMGwyLjk5IDguMjY0YS43NDkuNzQ5IDAgMSAwIDEuNDMxLS40NDJMOS40NCAxNC44MzRjLS4wNTYtLjE5Ny0uMTE1LS4zOTUtLjE3NC0uNTk1LS4yNi0uODczLS41MjYtMS43NjYtLjUyNi0yLjY2MnYtLjU4NGMwLS42Ni4wNTUtMS4zMi4xNjMtMS45NzNsLjIwMy0xLjIxNkwxMi43NSA3LjVhLjc1Ljc1IDAgMCAwIC43NDItLjg1NmwtLjM3Ny0yLjY0MUExLjc1IDEuNzUgMCAwIDAgMTEuMzgzIDIuNWgtLjEzM2EuNzUuNzUgMCAwIDAgMCAxLjVoLjEzM2EuMjUuMjUgMCAwIDEgLjI0Ny4yMTVMMTEuODg1IDZIMS42MTVsLjI1NS0xLjc4NUEuMjUuMjUgMCAwIDEgMi4xMTcgNGguMTMzYS43NS43NSAwIDEgMCAwLTEuNWgtLjEzM2MtLjg3IDAtMS42MDkuNjQtMS43MzIgMS41MDNsLS4zNzcgMi42NEEuNzUuNzUgMCAwIDAgLjc1IDcuNWwzLjYzLjMwM1ptMTIuNjM1IDEuODY0QTEgMSAwIDAgMSAxNy45NTcgOWg1LjA4NmEuNS41IDAgMCAxIC40NzIuNjY2bC0xLjAzIDIuOTE3YTEgMSAwIDAgMS0uOTQyLjY2N2gtNS4wODZhLjUuNSAwIDAgMS0uNDcyLS42NjZsMS4wMy0yLjkxN1ptMi45OTcgNS4wODMgMS41NTcgMS44MTYtMS4yMyAxLjkzNEgxMi43NWEuNzUuNzUgMCAwIDAgMCAxLjVoNy41ODRsMi4yOCAzLjY0OGEuNzUuNzUgMCAxIDAgMS4yNzItLjc5NmwtMi4yNS0zLjU5OCAxLjM5Ny0yLjE5NWExIDEgMCAwIDAtLjA4NC0xLjE4OGwtLjk2MS0xLjEyMWgtMS45NzZaIiBmaWxsPSIjMTgxQTFEIj48L3BhdGg+PC9zdmc+","Tread Bootcamp":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJUcmVhZEJvb3RjYW1wIj5UcmVhZCBCb290Y2FtcDwvdGl0bGU+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02Ljc1IDVhMiAyIDAgMSAwIDAtNCAyIDIgMCAwIDAgMCA0Wm0xMS4zNi0yYy0uNDQ3IDAtLjg0NS4yNTItLjk5NC42MjhMMTYuMDMgNi44NzNjLS4xMjIuMzA2LjEzMy42MjcuNDk3LjYyN2g1LjM2MmMuNDQ3IDAgLjg0NS0uMjUyLjk5NC0uNjI4bDEuMDg1LTMuMjQ1Yy4xMjItLjMwNi0uMTMzLS42MjctLjQ5Ny0uNjI3SDE4LjExWm0tMi41MDEgNi4zNjFBLjc1Ljc1IDAgMCAxIDE2LjI1IDloNWEuNzUuNzUgMCAwIDEgMCAxLjVoLTMuNzYzbDUuNDI4IDEwLjQwM0EuNzUuNzUgMCAwIDEgMjIuMjUgMjJIMTRhLjc1Ljc1IDAgMCAxIDAtMS41aDcuMDEzbC01LjQyOC0xMC40MDNhLjc1Ljc1IDAgMCAxIC4wMjQtLjczNlptLTIuNDk0LTUuMzU4QTEuNzUgMS43NSAwIDAgMCAxMS4zODMgMi41aC0uMTMzYS43NS43NSAwIDAgMCAwIDEuNWguMTMzYS4yNS4yNSAwIDAgMSAuMjQ3LjIxNUwxMS44ODUgNkgxLjYxNWwuMjU1LTEuNzg1QS4yNS4yNSAwIDAgMSAyLjExNyA0aC4xMzNhLjc1Ljc1IDAgMSAwIDAtMS41aC0uMTMzYy0uODcgMC0xLjYwOS42NC0xLjczMiAxLjUwM2wtLjM3NyAyLjY0QS43NS43NSAwIDAgMCAuNzUgNy41bDMuNjMuMzAzLjIwMyAxLjIxN2MuMTA5LjY1Mi4xNjMgMS4zMTIuMTYzIDEuOTczdi42M2MwIC44OTctLjI2NiAxLjc5LS41MjUgMi42NjMtLjA2LjItLjExOS4zOTgtLjE3NS41OTVsLTIuMDEzIDcuMTQ4YS43NS43NSAwIDAgMCAxLjQzMi40NDJsMi45OS04LjI2NGEuMzE0LjMxNCAwIDAgMSAuNTkgMGwyLjk5IDguMjY0YS43NDkuNzQ5IDAgMSAwIDEuNDMxLS40NDJMOS40NCAxNC44MzRjLS4wNTYtLjE5Ny0uMTE1LS4zOTUtLjE3NC0uNTk1LS4yNi0uODczLS41MjYtMS43NjYtLjUyNi0yLjY2MnYtLjU4NGMwLS42Ni4wNTUtMS4zMi4xNjMtMS45NzNsLjIwMy0xLjIxNkwxMi43NSA3LjVhLjc1Ljc1IDAgMCAwIC43NDItLjg1NmwtLjM3Ny0yLjY0MVoiIGZpbGw9IiMxODFBMUQiPjwvcGF0aD48L3N2Zz4=","Strength+":"data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlIGlkPSJTdHJlbmd0aCI+U3RyZW5ndGg8L3RpdGxlPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTUuNjIxIDVjMCAxLjEwNS0uOTAzIDItMi4wMTcgMmEyLjAwOSAyLjAwOSAwIDAgMS0yLjAxOC0yYzAtMS4xMDUuOTAzLTIgMi4wMTgtMiAxLjExNCAwIDIuMDE4Ljg5NSAyLjAxOCAyWm02LjQ5MiAzLjQ3My0uMjAzLS4yMDFhLjQ1My40NTMgMCAwIDAtLjQ0NS0uMTE4bC0uNjY0LjItMS41MDQtMS40OS4yMDItLjY1OGEuNDQzLjQ0MyAwIDAgMC0uMTE4LS40NDJsLS4yMDQtLjIwMWMtLjE3NC0uMTczLS40NDctLjE4Mi0uNjEtLjAybC0xLjE5MyAxLjE4MmMtLjE2My4xNjItLjE1NC40MzMuMDIuNjA1bC4yMDMuMjAyYy4xMi4xMTguMjkyLjE2NC40NDYuMTE3bC42NjMtLjJMMjAuMjEgOC45NGwtLjIwMi42NThhLjQ0My40NDMgMCAwIDAgLjExOS40NDFsLjIwMy4yMDJjLjE3NC4xNzIuNDQ4LjE4MS42MTEuMDJsMS4xOTItMS4xODJjLjE2My0uMTYyLjE1NS0uNDMzLS4wMi0uNjA2Wm0tOC41MzctLjM4YTEuNTIyIDEuNTIyIDAgMCAwLTEuODgtLjQzNmMtLjU0OS4yNy0uODY5Ljg0LS44MyAxLjQzLjIwOCAzLjI0Ni4wNTIgNS4xMjUtLjM0OCA2LjM0Ni0uMzc0IDEuMTQ0LS45NzUgMS43NTUtMS44NzIgMi40MjFsLTYuNTEgMy42OThhLjc0Ljc0IDAgMCAwLS4zMDYuOTgzYy4xNS4yOTYuNDg3LjQ5LjY3Ny40NjIuMDgtLjAxMS4yNy0uMDk1LjM0Ni0uMTMzbDcuNjItMy43NTFjMS4xMTMtLjYzNiAyLjEwNy0xLjU4IDIuNzYtMy4xNDguNDgtMS4xNTYuNzM1LTIuNjkxLjcyLTQuODkzbC43MTQuOTM3Yy40Ni42MDUgMS4zNTguNjY4IDEuOS4xMzNsMi4xMTEtMi4wNzhhLjczNy43MzcgMCAwIDAgMC0xLjA1NC43NjUuNzY1IDAgMCAwLTEuMDcgMGwtMS45MDUgMS44NzYtMi4xMjctMi43OTJabS43NzcgOC42ODkgMi43ODItLjI2MmEuMjUuMjUgMCAwIDEgLjI1Mi4yNDl2NS40ODFjMCAuNDEzLjMzOS43NDcuNzU2Ljc0N2EuNzUyLjc1MiAwIDAgMCAuNzU3LS43NDd2LTUuNzNjMC0uOTYzLS43OS0xLjc0NC0xLjc2NS0xLjc0NEgxNS4xM2MtLjEwNS40NS0uMjM0Ljg1Mi0uMzg1IDEuMjE3LS4xMi4yODgtLjI1MS41NDktLjM5My43ODlaIiBmaWxsPSIjMTgxQTFEIj48L3BhdGg+PC9zdmc+","Breathwrk":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAEtWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgdGlmZjpJbWFnZUxlbmd0aD0iMjU2IgogICB0aWZmOkltYWdlV2lkdGg9IjI1NiIKICAgdGlmZjpSZXNvbHV0aW9uVW5pdD0iMiIKICAgdGlmZjpYUmVzb2x1dGlvbj0iNzIvMSIKICAgdGlmZjpZUmVzb2x1dGlvbj0iNzIvMSIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjI1NiIKICAgZXhpZjpQaXhlbFlEaW1lbnNpb249IjI1NiIKICAgZXhpZjpDb2xvclNwYWNlPSIxIgogICBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIgogICBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiCiAgIHhtcDpNb2RpZnlEYXRlPSIyMDIz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"};
let source = fs.readFileSync(input, "utf8").replace(/const ISRC = \{[\s\S]*?\};/, () => "const ISRC = " + JSON.stringify(disciplineIcons) + ";");
// Keep the report's public navigation and cross-filters compact: instructors are
// filtered from Overview, and both selectors support multiple values. The source
// report is a single generated HTML file, so these small transforms keep the
// workflow's compiler as the single place that produces the published bundle.
const transforms = [
  ["f: uiSaved.f || { d: -1, i: -1, t: -1, l: -1, p: null }", "f: uiSaved.f || { d: -1, i: -1, ds: [], is: [], t: -1, l: -1, p: null }"],
  ["fetching: false };", "fetching: false, discOpen: false, instOpen: false, discQ: '', instQFilter: '' };"],
  ["const st = this.state, F = st.f;", "const st = this.state, F = Object.assign({ d: -1, i: -1, ds: [], is: [] }, st.f || {}); const dSel = Array.isArray(F.ds) ? F.ds : (F.d >= 0 ? [F.d] : []); const iSel = Array.isArray(F.is) ? F.is : (F.i >= 0 ? [F.i] : []);"],
  ["(skip === 'd' || F.d < 0 || r[1] === F.d) && (skip === 'i' || F.i < 0 || r[2] === F.i)", "(skip === 'd' || dSel.length === 0 || dSel.includes(r[1])) && (skip === 'i' || iSel.length === 0 || iSel.includes(r[2]))"],
  ["const setF = (patch) => this.setState({ f: Object.assign({}, F, patch) });\nconst tog = (k, v) => () => setF({ [k]: F[k] === v ? -1 : v });", "const setF = (patch) => { const next = Object.assign({}, F, patch); if (Object.prototype.hasOwnProperty.call(patch, 'ds')) next.d = patch.ds.length ? patch.ds[0] : -1; if (Object.prototype.hasOwnProperty.call(patch, 'is')) next.i = patch.is.length ? patch.is[0] : -1; this.setState({ f: next }); };\nconst tog = (k, v) => () => { const next = F[k] === v ? -1 : v; const patch = { [k]: next }; if (k === 'd') patch.ds = next < 0 ? [] : [next]; if (k === 'i') patch.is = next < 0 ? [] : [next]; setF(patch); };"],
  ["const hasF = F.d >= 0 || F.i >= 0 || F.t >= 0 || F.l >= 0 || !!F.p;", "const hasF = dSel.length > 0 || iSel.length > 0 || F.t >= 0 || F.l >= 0 || !!F.p;"],
  ["if (F.d >= 0) chips.push({ label: 'Discipline: ' + DISC[F.d], clear: () => setF({ d: -1 }) });", "if (dSel.length) chips.push({ label: dSel.length === 1 ? 'Discipline: ' + DISC[dSel[0]] : 'Disciplines: ' + dSel.length + ' selected', clear: () => setF({ d: -1, ds: [] }) });"],
  ["if (F.i >= 0) chips.push({ label: 'Instructor: ' + INST[F.i], clear: () => setF({ i: -1 }) });", "if (iSel.length) chips.push({ label: iSel.length === 1 ? 'Instructor: ' + INST[iSel[0]] : 'Instructors: ' + iSel.length + ' selected', clear: () => setF({ i: -1, is: [] }) });"],
  ["clearAll: () => setF({ d: -1, i: -1, t: -1, l: -1, p: null })", "clearAll: () => setF({ d: -1, i: -1, ds: [], is: [], t: -1, l: -1, p: null })"],
  ["[['overview', 'Overview'], ['inst', 'Instructors'], ['ach', 'Achievements'], ['log', 'Workout Log']]", "[['overview', 'Overview'], ['ach', 'Achievements'], ['log', 'Workout Log']]"] ,
  ["isOverview: st.page === 'overview', isDisc: st.page === 'disc', isInst: st.page === 'inst', isAch: st.page === 'ach', isLog: st.page === 'log',", "isOverview: st.page === 'overview', isDisc: false, isInst: false, isAch: st.page === 'ach', isLog: st.page === 'log',"],
  ["[['overview', 'Overview'], ['ach', 'Achievements'], ['log', 'Workout Log']]", "[['overview', 'Overview'], ['ach', 'Achievements']]"] ,
  ["isOverview: st.page === 'overview', isDisc: false, isInst: false, isAch: st.page === 'ach', isLog: st.page === 'log',", "isOverview: st.page === 'overview', isDisc: false, isInst: false, isAch: st.page === 'ach', isLog: false,"],
  ["const hasF = dSel.length > 0 || iSel.length > 0 || F.t >= 0 || F.l >= 0 || !!F.p;", "const hasF = dSel.length > 0 || iSel.length > 0 || F.t >= 0 || F.l >= 0 || !!F.p || !!F.q;"],
  ["chartTitle = st.mode === 'month' ? 'Minutes per day · ' + st.year : 'Minutes per month · ' + annY;", "chartTitle = st.mode === 'month' ? 'Minutes per day · ' + st.year : 'Minutes per month';"],
  ["const ey = yearOf(eff), em = dt(eff).getUTCMonth() + 1;", "const ey = st.mode === 'year' ? yearOf(s) : yearOf(eff), em = st.mode === 'year' ? 12 : dt(eff).getUTCMonth() + 1;"],
  ["(skip === 'd' || dSel.length === 0 || dSel.includes(r[1])) && (skip === 'i' || iSel.length === 0 || iSel.includes(r[2]))", "(skip === 'd' || dSel.length === 0 || dSel.includes(r[1])) && (skip === 'i' || iSel.length === 0 || iSel.includes(r[2])) && (skip === 'q' || !F.q || (() => { const t = r[10]; if (t === undefined || t < 0) return false; const m = t < 300 ? t + 1440 : t; return m >= F.q[0] && m < F.q[1]; })())"],
  ["clearAll: () => setF({ d: -1, i: -1, ds: [], is: [], t: -1, l: -1, p: null })", "clearAll: () => setF({ d: -1, i: -1, ds: [], is: [], t: -1, l: -1, p: null, q: null })"],
  ["const TOD = [['Early morning', 300, 480], ['Morning', 480, 720], ['Afternoon', 720, 1020], ['Evening', 1020, 1260], ['Night', 1260, 1740]];", "const TOD = [['Early', 300, 480], ['Morning', 480, 720], ['Afternoon', 720, 1020], ['Evening', 1020, 1260], ['Late', 1260, 1740]];"],
  ["const todRows = todC.map(([n, v], i) => ({ name: n + ' · ' + ['5–8', '8–12', '12–5', '5–9', '9–5'][i], val: num(v), pct: v ? Math.max(2, Math.round(100 * v / todMx)) : 0, bar: C.SLATE, row: 'background: transparent', pressed: 'false', open: () => {} }));", "const todRows = todC.map(([n, v], i) => { const a = TOD[i][1], b = TOD[i][2], selected = F.q && F.q[0] === a; return { name: n + ' · ' + ['5–8', '8–12', '12–5', '5–9', '9–5'][i], val: num(v), pct: v ? Math.max(2, Math.round(100 * v / todMx)) : 0, bar: selected ? C.TXT : C.SLATE, row: selected ? 'background: #FDF0F1' : 'background: transparent', pressed: selected ? 'true' : 'false', open: () => setF({ q: selected ? null : [a, b, n] }) }; });"],
  ["const chips = [];", "const chips = []; if (F.q) chips.push({ label: 'Time: ' + F.q[2], clear: () => setF({ q: null }) });"],
  ["const logRows = [...RD].sort((a, b) => cmp(lkey[SL.k](a), lkey[SL.k](b), SL.dir) || b[0] - a[0]).map((r) => ({ when: fd(r[0]), disc: DISC[r[1]], type: tname(r[3]), inst: INST[r[2]] || '—', len: String(r[4]), out: r[5] ? num(r[5]) : '—', dist: r[6] ? num(r[6], 2) : '—', spd: r[7] ? num(r[7], 1) : '—', hr: r[8] ? num(r[8]) : '—', cal: r[9] ? num(r[9]) : '—', pickI: INST[r[2]] ? tog('i', r[2]) : () => {}, pickD: tog('d', r[1]), pickT: tog('t', r[3]), linkable: !!INST[r[2]], plain: !INST[r[2]] }));", "const logRows = [...RD].sort((a, b) => cmp(lkey[SL.k](a), lkey[SL.k](b), SL.dir) || b[0] - a[0]).map((r) => ({ when: fd(r[0]), disc: DISC[r[1]], type: tname(r[3]), inst: INST[r[2]] || '—', len: String(r[4]), out: r[5] ? num(r[5]) : '—', dist: r[6] ? num(r[6], 2) : '—', spd: r[7] ? num(r[7], 1) : '—', hr: r[8] ? num(r[8]) : '—', cal: r[9] ? num(r[9]) : '—', pickI: INST[r[2]] ? tog('i', r[2]) : () => {}, pickD: tog('d', r[1]), pickT: tog('t', r[3]), linkable: !!INST[r[2]], plain: !INST[r[2]] })); const exportCsv = () => { const q = String.fromCharCode(34); const esc = (v) => q + String(v ?? '').replace(new RegExp(q, 'g'), q + q) + q; const rows = [['DATE', 'DISCIPLINE', 'CLASS TYPE', 'INSTRUCTOR', 'MIN', 'OUTPUT kJ', 'DIST km', 'SPEED km/h', 'HR', 'CAL'], ...logRows.map((r) => [r.when, r.disc, r.type, r.inst, r.len, r.out, r.dist, r.spd, r.hr, r.cal])]; const blob = new Blob([rows.map((row) => row.map(esc).join(',')).join('\\n') + '\\n'], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'peloton-workout-log.csv'; a.click(); URL.revokeObjectURL(url); };"],
  ["logRows: logRows, logHdr: logHdr,", "logRows: logRows, logHdr: logHdr, exportCsv: exportCsv,"],
  ["\"logRows\", \"logHdr\",", "\"logRows\", \"logHdr\", \"exportCsv\","],
  ["showAnalysis: st.page === 'overview' || (st.page === 'inst' && instSel),", "showAnalysis: st.page === 'overview',"],
  ["discVal: String(F.d), discOpts: discOpts, onDisc: (ev) => setF({ d: +ev.target.value }),", "discVal: dSel.length === DISC.length ? ['-1'] : dSel.map(String), discOpts: discOpts, onDisc: (ev) => { const v = +ev.target.value; if (v < 0) return setF({ ds: DISC.map((_, i) => i) }); const vals = dSel.includes(v) ? dSel.filter((x) => x !== v) : dSel.concat(v); setF({ ds: vals }); },"],
  ["instVal: String(F.i), instOpts: instOpts, onInst: (ev) => setF({ i: +ev.target.value }),", "instVal: iSel.length === instAll.length ? ['-1'] : iSel.map(String), instOpts: instOpts, onInst: (ev) => { const v = +ev.target.value; if (v < 0) return setF({ is: instAll.map(([i]) => i) }); const vals = iSel.includes(v) ? iSel.filter((x) => x !== v) : iSel.concat(v); setF({ is: vals }); }, discOpen: st.discOpen, instOpen: st.instOpen, discQ: st.discQ || '', instQFilter: st.instQFilter || '', toggleDiscMenu: () => this.setState({ discOpen: !st.discOpen, instOpen: false }), toggleInstMenu: () => this.setState({ instOpen: !st.instOpen, discOpen: false }), onDiscQ: (ev) => this.setState({ discQ: ev.target.value }), onInstFilterQ: (ev) => this.setState({ instQFilter: ev.target.value }), clearDiscFilter: () => setF({ d: -1, ds: [] }), clearInstFilter: () => setF({ i: -1, is: [] }), discLabel: dSel.length ? (dSel.length === 1 ? DISC[dSel[0]] : dSel.length + ' selected') : 'All disciplines', instLabel: iSel.length ? (iSel.length === 1 ? INST[iSel[0]] : iSel.length + ' selected') : 'All instructors (' + instAll.length + ')', onDiscOption: (v) => { const n = +v; const vals = dSel.includes(n) ? dSel.filter((x) => x !== n) : dSel.concat(n); setF({ ds: vals }); }, onInstOption: (v) => { const n = +v; const vals = iSel.includes(n) ? iSel.filter((x) => x !== n) : iSel.concat(n); setF({ is: vals }); },"],
  ["\"discVal\", \"discOpts\", \"onDisc\", \"instVal\", \"instOpts\", \"onInst\",", "\"discVal\", \"discOpts\", \"onDisc\", \"instVal\", \"instOpts\", \"onInst\", \"discOpen\", \"instOpen\", \"discQ\", \"instQFilter\", \"toggleDiscMenu\", \"toggleInstMenu\", \"onDiscQ\", \"onInstFilterQ\", \"clearDiscFilter\", \"clearInstFilter\", \"discLabel\", \"instLabel\", \"onDiscOption\", \"onInstOption\", "],
  ["\"chartTitle\", \"chartHint\",", "\"chartTitle\", \"chartHint\", \"avgY\", \"avgMins\", \"avgLabel\", "],
  ["This page pulls your latest workouts from Peloton automatically every night. Update data reloads the newest copy.", "Update data connects to Peloton and loads your latest workout history when you choose."],
  ["{{dataLabel}} <span style=\\\"color: #3A5A8C\\\">{{loadMsg}}<\\/span>", "{{loadMsg}}"],
  ["<template v-if=\\\"isInst\\\"><div style=\\\"display: flex; flex-direction: column; gap: 4px\\\"><label for=\\\"f-inst\\\"", "<template v-if=\\\"isOverview\\\"><div style=\\\"display: flex; flex-direction: column; gap: 4px\\\"><label for=\\\"f-inst\\\""],
  ["<select id=\\\"f-disc\\\" :value=\\\"discVal\\\" @change=\\\"onDisc\\\"", "<select id=\\\"f-disc\\\" multiple size=\\\"1\\\" :value=\\\"discVal\\\" @change=\\\"onDisc\\\""],
  ["<select id=\\\"f-inst\\\" :value=\\\"instVal\\\" @change=\\\"onInst\\\"", "<select id=\\\"f-inst\\\" multiple size=\\\"1\\\" :value=\\\"instVal\\\" @change=\\\"onInst\\\""],
];
for (const [from, to] of transforms) {
  if (!source.includes(from)) throw new Error(`Report transform did not match: ${from.slice(0, 80)}`);
  source = source.replace(from, to);
}
// The current catalogue, eligibility and credited totals come from Peloton.
const replaceChallengeSource = (from, to) => {
  if (!source.includes(from)) throw new Error('Challenge transform did not match: ' + from.slice(0, 80));
  source = source.replace(from, to);
};
replaceChallengeSource("let before = '';\ntry { const raw = window.localStorage.getItem('pelotonReportData'); if (raw) before = JSON.parse(raw).generated || ''; } catch (err) {}", "const requestedAt = Date.now();");
replaceChallengeSource("const latest = await fetch('data/peloton_data.json?ts='", `let updateStatus = null;
const outcome = await fetch('data/update-status.json?ts=' + Date.now(), { cache: 'no-store' });
if (outcome.ok) updateStatus = await outcome.json();
const freshOutcome = updateStatus && Date.parse(updateStatus.completed_at) >= requestedAt;
if (freshOutcome && updateStatus.state === 'error') {
  throw new Error(updateStatus.code === 'peloton_auth_required' ? 'Peloton sign-in expired or was rejected. Renew PELOTON_TOKEN in GitHub Actions secrets, then try Update again. Your previous report is unchanged.' : 'Peloton could not refresh the data. Try again shortly; your previous report is unchanged.');
}
const latest = await fetch('data/peloton_data.json?ts='`);
replaceChallengeSource("if (!before || p.generated !== before)", "if (freshOutcome && updateStatus.state === 'success' && Date.parse(p.generated) >= requestedAt)");
const staleFallbackStart = source.indexOf('if (latestData) {');
const staleFallbackEnd = source.indexOf("throw new Error('The published report could not be reached. Try again in a minute.');", staleFallbackStart);
if (staleFallbackStart < 0 || staleFallbackEnd < 0) throw new Error('Update timeout fallback was not found');
source = source.slice(0, staleFallbackStart) + source.slice(staleFallbackEnd);
replaceChallengeSource("The published report could not be reached. Try again in a minute.", "The update has not finished or could not be published. Try again in a minute; your previous report is unchanged.");
replaceChallengeSource('x.cal || 0, t]);', "x.cal || 0, t, String(x.title || '')]);");
// Like class length, time-of-day is a facet: ignore its own selection when
// counting choices, while retaining all other active filters.
replaceChallengeSource('const timed = RD.filter(', "const timed = RX('q').filter(");
replaceChallengeSource("bar: selected ? C.TXT : C.SLATE, row: selected ? 'background: #FDF0F1'", "bar: selected ? C.TXT : (F.q ? C.FADE : C.SLATE), row: selected ? 'background: #EEF2F8; font-weight: 700'");
replaceChallengeSource('badges: badges, generated:', 'badges: badges, activeChallenges: Array.isArray(j.active_challenges) ? j.active_challenges : null, annualProgress: j.annual_progress || {}, generated:');
const catalogueStart = source.indexOf('const ACTIVE_CHALLENGES = [');
const catalogueEnd = source.indexOf('\n];', catalogueStart);
if (catalogueStart < 0 || catalogueEnd < 0) throw new Error('Fixed challenge catalogue was not found');
source = source.slice(0, catalogueStart) + 'const ACTIVE_CHALLENGES = this.state.loaded && this.state.loaded.activeChallenges;' + source.slice(catalogueEnd + 3);
const challengeRowsStart = source.indexOf('const latestDate = dt(last),');
const challengeRowsEnd = source.indexOf('const chips = [];', challengeRowsStart);
if (challengeRowsStart < 0 || challengeRowsEnd < 0) throw new Error('Challenge calculations were not found');
source = source.slice(0, challengeRowsStart) + `const challengeNow = Date.now();
const challengeRows = (ACTIVE_CHALLENGES || []).filter((c) => {
  if (!c || !/^[0-9a-f]{32}$/.test(c.id) || c.joined !== true || c.status !== 'current' || c.completed) return false;
  if (c.start && !(Date.parse(c.start) <= challengeNow)) return false;
  if (c.end && !(Date.parse(c.end) > challengeNow)) return false;
  const tiers = Array.isArray(c.tiers) ? c.tiers : [];
  const target = tiers.length ? tiers[tiers.length - 1].value : null;
  return !(typeof target === 'number' && target > 0 && typeof c.value === 'number' && c.value >= target);
}).map((c) => {
  const tiers = Array.isArray(c.tiers) ? c.tiers : [];
  const goal = tiers[tiers.length - 1];
  const available = typeof c.value === 'number' && Number.isFinite(c.value) && c.value >= 0;
  const shownValue = c.display_value == null ? (available ? formatMetric(c.value) : '') : formatMetric(c.display_value);
  const goalText = goal ? goal.title + ': ' + formatMetric(goal.display_value) + ' ' + goal.display_unit : '';
  return { n: c.title, d: c.description, u: 'https://members.onepeloton.com/en-CA/challenges/active/' + c.id,
    status: available ? 'Current: ' + shownValue + ' ' + c.display_unit + (goalText ? ' · ' + goalText : '') : 'Progress unavailable · Update data to retry',
    tierText: tiers.map((t) => t.title + ': ' + formatMetric(t.display_value) + ' ' + t.display_unit).join(' · '),
    pct: available && goal && goal.value > 0 ? Math.min(100, Math.round(100 * c.value / goal.value)) : 0 };
});
const challengeNotice = !Array.isArray(ACTIVE_CHALLENGES) ? 'Challenge catalogue unavailable. Update data to retry.' : challengeRows.length ? '' : 'No joined active incomplete challenges.';
` + source.slice(challengeRowsEnd);
replaceChallengeSource('activeChallenges: challengeRows, ac: challengeRows,', 'activeChallenges: challengeRows, ac: challengeRows, challengeNotice: challengeNotice,');
replaceChallengeSource('"activeChallenges",', '"challengeNotice", "activeChallenges",');

// Badge years come from the whole catalogue so changing earned status cannot
// change the year or its navigation limits. Preserve an existing saved page.
const replaceBadgeSource = (from, to) => {
  if (!source.includes(from)) throw new Error('Badge year transform did not match: ' + from.slice(0, 80));
  source = source.replace(from, to);
};
replaceBadgeSource('badgePage: this.state.badgePage,', 'badgePage: this.state.badgePage, badgeYear: this.state.badgeYear,');
replaceBadgeSource('badgePage: Number(uiSaved.badgePage) || 1,', 'badgePage: Number(uiSaved.badgePage) || 1, badgeYear: uiSaved.badgeYear,');
const badgeLogicStart = source.indexOf('const bv = st.badgeView, bEarned');
const badgeLogicEnd = source.indexOf('const groups = [];', badgeLogicStart);
if (badgeLogicStart < 0 || badgeLogicEnd < 0) throw new Error('Badge year logic was not found');
source = source.slice(0, badgeLogicStart) + `const bv = st.badgeView;
const badgeYears = [...new Set(BADGES.map((b) => String(b.y)))].sort((a, b) => Number(b) - Number(a));
const badgeTotalPages = Math.max(1, badgeYears.length);
const savedBadgePage = Math.min(Math.max(1, Number(st.badgePage) || 1), badgeTotalPages);
const badgeYear = badgeYears.includes(String(st.badgeYear)) ? String(st.badgeYear) : (badgeYears[savedBadgePage - 1] || String(new Date().getFullYear()));
const badgePage = Math.max(0, badgeYears.indexOf(badgeYear)) + 1;
const yearBadges = BADGES.filter((b) => String(b.y) === badgeYear);
const bEarned = yearBadges.filter((b) => b.e).length;
const shown = yearBadges.filter((b) => bv === 'all' || (bv === 'missing' ? !b.e : b.e));
const pageShown = shown;
` + source.slice(badgeLogicEnd);
replaceBadgeSource('badgeView: id, badgePage: 1', 'badgeView: id, badgeYear: badgeYear');
replaceBadgeSource("badgePageNav: { page: badgePage, year: badgeYear, total: badgeTotalPages, prev: () => this.setState({ badgePage: Math.max(1, badgePage - 1) }), next: () => this.setState({ badgePage: Math.min(badgeTotalPages, badgePage + 1) }), canPrev: badgePage > 1, canNext: badgePage < badgeTotalPages }", "badgePageNav: { page: badgePage, year: badgeYear, total: badgeTotalPages, prev: () => this.setState({ badgeYear: badgeYears[Math.min(badgeTotalPages - 1, badgePage)] || badgeYear }), next: () => this.setState({ badgeYear: badgeYears[Math.max(0, badgePage - 2)] || badgeYear }), canPrev: badgePage < badgeTotalPages, canNext: badgePage > 1 }");
replaceBadgeSource("(BADGES.length - bEarned)", "(yearBadges.length - bEarned)");
replaceBadgeSource("'All (' + BADGES.length", "'All (' + yearBadges.length");
replaceBadgeSource('bTotal: String(BADGES.length), bPct: Math.round(100 * bEarned / BADGES.length)', 'bTotal: String(yearBadges.length), bPct: yearBadges.length ? Math.round(100 * bEarned / yearBadges.length) : 0');

// Format displayed quantities only; years, dates, IDs and chart coordinates
// remain unchanged. Numeric API display values use the same grouping rule.
const formatSource = (from, to) => {
  if (!source.includes(from)) throw new Error('Number format transform did not match: ' + from.slice(0, 80));
  source = source.replaceAll(from, to);
};
formatSource("const hm = (m) => Math.floor(m / 60) + 'h '", "const hm = (m) => num(Math.floor(m / 60)) + 'h '");
formatSource("return mm + ':'", "return num(mm) + ':'");
formatSource("avgLabel = avgMins ? Math.round(avgMins) + ' min avg' : '';", "avgLabel = avgMins ? num(Math.round(avgMins)) + ' min' : '';");
formatSource(": t + ' ' + nn[1];", ": num(t) + ' ' + nn[1];");
formatSource("r[4] + ' min'", "num(r[4]) + ' min'");
formatSource("len: String(r[4])", "len: num(r[4])");
formatSource("len: L + ' min'", "len: num(L) + ' min'");
formatSource("b.times + (b.times === 1", "num(b.times) + (b.times === 1");
formatSource("'Earned ' + b.e + ' times'", "'Earned ' + num(b.e) + ' times'");
formatSource("g.items.length + (g.items.length === 1", "num(g.items.length) + (g.items.length === 1");
formatSource("'Earned (' + bEarned", "'Earned (' + num(bEarned)");
formatSource("'Not earned (' + (yearBadges.length - bEarned)", "'Not earned (' + num(yearBadges.length - bEarned)");
formatSource("'All (' + yearBadges.length", "'All (' + num(yearBadges.length)");
formatSource('bEarned: String(bEarned), bTotal: String(yearBadges.length)', 'bEarned: num(bEarned), bTotal: num(yearBadges.length)');
formatSource("dSel.length + ' selected'", "num(dSel.length) + ' selected'");
formatSource("iSel.length + ' selected'", "num(iSel.length) + ' selected'");
formatSource("instAll.length + ')'", "num(instAll.length) + ')'");
formatSource('act30: String(act30)', 'act30: num(act30)');
formatSource("+ Math.abs(delta) +", "+ num(Math.abs(delta)) +");
formatSource("const hm = (m)", String.raw`const formatMetric = (value) => {
  const raw = String(value ?? '').trim().replace(/,/g, '');
  const number = /^[+-]?\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : NaN;
  return Number.isFinite(number) ? number.toLocaleString('en-CA', { maximumFractionDigits: 20 }) : String(value ?? '');
};
const hm = (m)`);
formatSource('const yMin = sum(yRows, 4);', `const annualMinutes = (year, fallback) => {
  const credited = this.state.loaded && this.state.loaded.annualProgress && this.state.loaded.annualProgress[String(year)];
  const card = (ACTIVE_CHALLENGES || []).find((c) => c.title === 'The Annual ' + year);
  const value = typeof credited === 'number' ? credited : card && card.value;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
};
const yMin = annualMinutes(annY, sum(yRows, 4));
const annualGoalReached = yMin >= GOAL;`);
formatSource('if (t >= GOAL) { doneAt', 'if (annualGoalReached && t >= GOAL) { doneAt');
formatSource('const m = sum(W.filter((r) => yearOf(r[0]) === y && r[0] <= eff), 4); annualYears.push', 'const m = annualMinutes(y, sum(W.filter((r) => yearOf(r[0]) === y && r[0] <= eff), 4)); annualYears.push');
formatSource("pctTxt: Math.round(100 * yMin / GOAL) + '%'", "pctTxt: num(Math.round(100 * yMin / GOAL)) + '%'");
formatSource("paceTxt: doneAt !== null ? 'Earned on ' + fd(doneAt)", "paceTxt: annualGoalReached ? (doneAt !== null ? 'Earned on ' + fd(doneAt) : 'Goal reached')");
formatSource("needTxt: doneAt !== null ? 'Goal reached'", "needTxt: annualGoalReached ? 'Goal reached'");
formatSource('(gap >= 0 || doneAt !== null)', '(gap >= 0 || annualGoalReached)');

// The activity card always browses complete 30-day windows anchored to the
// viewer's local calendar date, independently of report/date filters or sync age.
formatSource("const calE = F.p ? Math.min(F.p[1], last) : eff;", `const activityNow = new Date(st.activityClock || Date.now());
const activityToday = idx(activityNow.getFullYear(), activityNow.getMonth() + 1, activityNow.getDate());
const maxActivityOffset = Math.max(0, Math.floor((activityToday - first) / 30));
const activityOffset = Math.min(maxActivityOffset, Math.max(0, Math.floor(Number(st.activityOffset) || 0)));
const moveActivity = (delta) => this.setState({ activityOffset: Math.min(maxActivityOffset, Math.max(0, activityOffset + delta)) });
const calE = activityToday - activityOffset * 30;`);
formatSource("const calEnd = calE + (6 - ((calE + 5) % 7)), calStart = calEnd - 34;", "const calEnd = calE + (6 - ((calE + 5) % 7)), calFirst = calE - 29, calStart = calFirst - ((calFirst + 5) % 7);");
formatSource("const on = actF.has(d) && d <= calE, inw = d > calE - 30 && d <= calE;", "const inw = d > calE - 30 && d <= calE, on = actF.has(d) && inw;");
formatSource("pick: d <= last ? () => setF({ p: selD ? null : [d, d, fd(d)] }) : () => {}", "disabled: !inw, pick: inw ? () => setF({ p: selD ? null : [d, d, fd(d)] }) : () => {}");
formatSource("cal30: cal30,", "activityOffset: activityOffset, canPrevActivity: activityOffset < maxActivityOffset, canNextActivity: activityOffset > 0, prevActivity: () => moveActivity(1), nextActivity: () => moveActivity(-1), cal30: cal30,");
formatSource('"cal30", "act30",', '"activityOffset", "canPrevActivity", "canNextActivity", "prevActivity", "nextActivity", "cal30", "act30",');
formatSource("(delta === 0 ? 'same as' : (delta > 0 ? '▲ ' : '▼ ') + num(Math.abs(delta)) + (Math.abs(delta) === 1 ? ' day vs.' : ' days vs.')) + ' previous 30'", "(delta === 0 ? '' : delta > 0 ? '▲ ' : '▼ ') + num(Math.abs(delta)) + (Math.abs(delta) === 1 ? ' day vs.' : ' days vs.') + ' last 30'");
formatSource("calTitle: '30-day activity", "calTitle: '30 Day Activity");
formatSource('comp.state = Vue.reactive(comp.state);', `comp.state = Vue.reactive(comp.state);
  let activityDay = new Date().toDateString();
  const refreshActivityDay = () => {
    const currentDay = new Date().toDateString();
    if (currentDay !== activityDay) {
      activityDay = currentDay;
      comp.setState({ activityClock: Date.now() });
    }
  };
  window.setInterval(refreshActivityDay, 60000);
  document.addEventListener('visibilitychange', refreshActivityDay);`);


// Match the discipline milestone sequence on Peloton's Achievements page.
formatSource("const MDISC = ['Strength', 'Meditation', 'Cycling', 'Walking', 'Yoga', 'Stretching', 'Running', 'Bike Bootcamp', 'Cardio', 'Rowing', 'Tread Bootcamp', 'Row Bootcamp'];", "const MDISC = ['Cycling', 'Running', 'Walking', 'Rowing', 'Bike Bootcamp', 'Tread Bootcamp', 'Row Bootcamp', 'Strength', 'Stretching', 'Yoga', 'Meditation', 'Cardio'];");
// Capitalize display headings without changing discipline names, data or keys.
formatSource('const num = (v, p)', "const titleCaseHeading = (value) => String(value).replace(/\\b[a-z]/g, (letter) => letter.toUpperCase());\nconst num = (v, p)");
formatSource('title: title,', 'title: titleCaseHeading(title),');
formatSource('chartTitle: chartTitle,', 'chartTitle: titleCaseHeading(chartTitle),');
formatSource("heatTitle: 'Daily heatmap'", "heatTitle: 'Daily Heatmap'");
formatSource("recentTitle: inRange.length ? 'Earned in ' + rangeLabel : 'Most recent achievements'", "recentTitle: titleCaseHeading(inRange.length ? 'Earned in ' + rangeLabel : 'Most recent achievements')");

// All-time totals keep their full range; each activity chart browses one year.
const replaceYearSource = (from, to) => {
  if (!source.includes(from)) throw new Error('Calendar-year transform did not match: ' + from.slice(0, 80));
  source = source.replace(from, to);
};
replaceYearSource('const lastY = yearOf(last);', `const lastY = yearOf(last);
const firstY = yearOf(first);
const chartYear = (value) => Number.isInteger(value) ? Math.max(firstY, Math.min(lastY, value)) : lastY;
const monthlyYear = chartYear(st.monthlyYear), heatmapYear = chartYear(st.heatmapYear);
const moveChartYear = (key, value, delta) => this.setState({ [key]: chartYear(value + delta) });`);
replaceYearSource("let y = st.mode === 'all' ? yearOf(first) : yearOf(s), m = st.mode === 'all' ? dt(first).getUTCMonth() + 1 : 1;", "let y = st.mode === 'all' ? monthlyYear : yearOf(s), m = 1;");
replaceYearSource("const ey = st.mode === 'year' ? yearOf(s) : yearOf(eff), em = st.mode === 'year' ? 12 : dt(eff).getUTCMonth() + 1;", "const ey = st.mode === 'all' ? monthlyYear : yearOf(s), em = 12;");
replaceYearSource("'Minutes per month'; chartHint", "'Minutes per month' + (st.mode === 'all' ? ' · ' + monthlyYear : ''); chartHint");
replaceYearSource("const heatYears = st.mode === 'all' ? (() => { const a = []; for (let y = lastY; y >= yearOf(first); y--) a.push(y); return a; })() : [annY];", "const heatYears = [st.mode === 'all' ? heatmapYear : annY];");
replaceYearSource('kpis: kpis, bars: bars,', `isAll: st.mode === 'all', monthlyYear: monthlyYear, heatmapYear: heatmapYear,
canPrevMonthlyYear: monthlyYear > firstY, canNextMonthlyYear: monthlyYear < lastY,
canPrevHeatmapYear: heatmapYear > firstY, canNextHeatmapYear: heatmapYear < lastY,
prevMonthlyYear: () => moveChartYear('monthlyYear', monthlyYear, -1), nextMonthlyYear: () => moveChartYear('monthlyYear', monthlyYear, 1),
prevHeatmapYear: () => moveChartYear('heatmapYear', heatmapYear, -1), nextHeatmapYear: () => moveChartYear('heatmapYear', heatmapYear, 1),
kpis: kpis, bars: bars,`);
replaceYearSource('"kpis", "bars",', '"isAll", "monthlyYear", "heatmapYear", "canPrevMonthlyYear", "canNextMonthlyYear", "canPrevHeatmapYear", "canNextHeatmapYear", "prevMonthlyYear", "nextMonthlyYear", "prevHeatmapYear", "nextHeatmapYear", "kpis", "bars",');
replaceYearSource('</style>', '.chart-year-heading{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}.chart-year-nav{display:flex;align-items:center;gap:8px;font-size:14px;font-variant-numeric:tabular-nums}.chart-year-nav button{min-width:44px;min-height:44px;border:1px solid #C9CDD3;border-radius:8px;background:#FFFFFF;color:#181A1D;font:inherit;cursor:pointer}.chart-year-nav button:disabled{opacity:.4;cursor:default}.chart-year-nav button:focus-visible{outline:2px solid #3A5A8C;outline-offset:2px}\n</style>');

// The report used to overwrite the connector-backed button with a second,
// nightly JSON loader and invoke it during startup. Remove that legacy path so
// data is fetched only when the user presses Update.
source = source.replace(/\/\/ GitHub Pages:[\s\S]*?Component\.prototype\.fetchLive = async function \(quiet\) \{[\s\S]*?\n\};\n/, '');
source = source.replace(/\n\s*comp\.fetchLive\(true\);\n/, '\n');
const replaceFilterControl = (id, menu) => {
  const start = source.indexOf(String.raw`<select id=\"${id}\"`);
  const endToken = String.raw`<\/select>`;
  const end = source.indexOf(endToken, start);
  if (start < 0 || end < 0) throw new Error(`Report ${id} control was not found`);
  source = source.slice(0, start) + JSON.stringify(menu).slice(1, -1) + source.slice(end + endToken.length);
};
replaceFilterControl('f-disc', `<div style="position: relative; min-width: 210px"><button type="button" @click="toggleDiscMenu" :aria-expanded="discOpen" aria-controls="f-disc-menu" style="min-height: 44px; width: 100%; padding: 0 12px; border-radius: 10px; background: #FFFFFF; color: #181A1D; border: 1px solid #C9CDD3; font: inherit; font-size: 14px; text-align: left; cursor: pointer">{{discLabel}}</button><div v-if="discOpen" id="f-disc-menu" role="group" aria-label="Discipline filter" style="position: absolute; z-index: 20; top: 48px; left: 0; width: 280px; max-height: 360px; overflow: auto; padding: 8px; border: 1px solid #C9CDD3; border-radius: 10px; background: #FFFFFF; box-shadow: 0 8px 24px rgba(24,26,29,.16)" @click.stop><button type="button" @click="clearDiscFilter" :disabled="!discVal.length" style="display: block; margin-bottom: 8px; padding: 4px 0; border: 0; background: transparent; color: #C8102E; font: inherit; font-size: 12px; cursor: pointer">Clear filter</button><input type="search" :value="discQ" @input="onDiscQ" placeholder="Search Discipline" aria-label="Search Discipline" autocomplete="off" style="display: block; width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 7px 8px; border: 1px solid #C9CDD3; border-radius: 7px; font: inherit; font-size: 13px"><label v-for="o in discOpts.filter((x) => String(x.v) !== '-1' && String(x.t).toLowerCase().includes(String(discQ).toLowerCase()))" :key="o.v" style="display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 13px; cursor: pointer"><input type="checkbox" :checked="discVal.includes(o.v)" @change="onDiscOption(o.v)"> {{o.t}}</label></div></div>`);
replaceFilterControl('f-inst', `<div style="position: relative; min-width: 240px"><button type="button" @click="toggleInstMenu" :aria-expanded="instOpen" aria-controls="f-inst-menu" style="min-height: 44px; width: 100%; padding: 0 12px; border-radius: 10px; background: #FFFFFF; color: #181A1D; border: 1px solid #C9CDD3; font: inherit; font-size: 14px; text-align: left; cursor: pointer">{{instLabel}}</button><div v-if="instOpen" id="f-inst-menu" role="group" aria-label="Instructor filter" style="position: absolute; z-index: 20; top: 48px; left: 0; width: 300px; max-height: 360px; overflow: auto; padding: 8px; border: 1px solid #C9CDD3; border-radius: 10px; background: #FFFFFF; box-shadow: 0 8px 24px rgba(24,26,29,.16)" @click.stop><button type="button" @click="clearInstFilter" :disabled="!instVal.length" style="display: block; margin-bottom: 8px; padding: 4px 0; border: 0; background: transparent; color: #C8102E; font: inherit; font-size: 12px; cursor: pointer">Clear filter</button><input type="search" :value="instQFilter" @input="onInstFilterQ" placeholder="Search Instructor" aria-label="Search Instructor" autocomplete="off" style="display: block; width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 7px 8px; border: 1px solid #C9CDD3; border-radius: 7px; font: inherit; font-size: 13px"><label v-for="o in instOpts.filter((x) => String(x.v) !== '-1' && String(x.t).toLowerCase().includes(String(instQFilter).toLowerCase()))" :key="o.v" style="display: flex; align-items: center; gap: 8px; padding: 7px 6px; font-size: 13px; cursor: pointer"><input type="checkbox" :checked="instVal.includes(o.v)" @change="onInstOption(o.v)"> {{o.t}}</label></div></div>`);
const property = "    template: \"";
const start = source.indexOf(property);
if (start < 0) throw new Error("Vue template property was not found");
const valueStart = start + property.length;
const marker = String.fromCharCode(34) + ",";
const lfMarker = marker + String.fromCharCode(10) + "    setup()";
const crlfMarker = marker + String.fromCharCode(13) + String.fromCharCode(10) + "    setup()";
const valueEnd = (() => {
  const lfEnd = source.indexOf(lfMarker, valueStart);
  if (lfEnd >= 0) return lfEnd;
  return source.indexOf(crlfMarker, valueStart);
})();
if (valueEnd < 0) throw new Error("Vue template terminator was not found");
let template = JSON.parse(String.fromCharCode(34) + source.slice(valueStart, valueEnd) + String.fromCharCode(34));
template = template.replace('Peloton counts Strength+ in Strength and Breathwrk in Meditation. Select a card to filter the records below.', '')
  .replace('Current monthly &amp; active challenges', 'Active challenges')
  .replace('Current monthly & active challenges', 'Active challenges')
  .replace('Live challenge catalogue checked Nov 6, 2026 · open a challenge for your current progress.', 'Joined challenges and credited progress from your latest Peloton update.')
  .replace('<template v-for="(c, c_i) in activeChallenges"', '<p v-if="challengeNotice" role="status">{{challengeNotice}}</p><template v-for="(c, c_i) in activeChallenges"');

// Put the compact 30-day activity card beside the daily heatmap, while keeping
// the minutes-per-month chart on its own row so the primary activity controls
// read as one focused dashboard block on desktop and stack cleanly on mobile.
const calTitleIndex = template.indexOf('{{calTitle}}');
const activityRowStart = template.lastIndexOf('<div style="display: flex; flex-wrap: wrap; gap: 14px">', calTitleIndex);
const activityRowEndToken = '</svg></section></div>';
const activityRowEnd = template.indexOf(activityRowEndToken, calTitleIndex) + activityRowEndToken.length;
const heatTitleIndex = template.indexOf('{{heatTitle}}', activityRowEnd);
const heatStart = template.lastIndexOf('<section', heatTitleIndex);
const heatEndMarker = '\n<div style="display: flex; flex-wrap: wrap; gap: 14px">\n<section style="flex: 1 1 290px;';
const heatEnd = template.indexOf(heatEndMarker, heatStart);
if (calTitleIndex < 0 || activityRowStart < 0 || activityRowEnd <= activityRowStart || heatTitleIndex < 0 || heatStart < 0 || heatEnd <= heatStart) {
  throw new Error('Activity chart layout boundaries were not found');
}
const activityRow = template.slice(activityRowStart, activityRowEnd);
const calStart = activityRow.indexOf('<section');
const calEnd = activityRow.indexOf('</section>', calStart) + '</section>'.length;
const chartStart = activityRow.indexOf('<section', calEnd);
const chartEnd = activityRow.lastIndexOf('</section>') + '</section>'.length;
if (calStart < 0 || calEnd <= calStart || chartStart < 0 || chartEnd <= chartStart) {
  throw new Error('Activity and monthly chart sections were not found');
}
const calendarBlock = activityRow.slice(calStart, calEnd)
  .replace('<section ', '<section data-year-chart class="activity-calendar" ')
  .replace('flex: 1 1 320px;', 'flex: 0 1 300px; max-width: 320px;')
  .replace('padding: 20px;', 'padding: 8px;')
  .replace('grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px;', 'grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px;')
  .replace('padding-top: 8px;', 'padding-top: 4px;')
  .replace('@click="c.pick" :aria-label="c.label"', '@click="c.pick" :disabled="c.disabled" :aria-label="c.label"')
  .replace('</section>', '<div class="chart-year-nav" role="group" aria-label="30 Day Activity periods"><button class="circle-control chart-year-arrow chart-year-prev" type="button" @click="prevActivity" :disabled="!canPrevActivity" aria-label="Previous 30 days" title="Previous 30 days">←</button><button class="circle-control chart-year-arrow chart-year-next" type="button" @click="nextActivity" :disabled="!canNextActivity" aria-label="Next 30 days" title="Next 30 days">→</button></div></section>');
const monthlyBlock = activityRow.slice(chartStart, chartEnd)
  .replace('<section ', '<section class="minutes-monthly" ')
  .replace('flex: 3 1 600px;', 'flex: 1 1 600px; align-self: flex-start;')
  .replace('padding: 20px;', 'padding: 12px;')
  .replace('gap: 12px; box-sizing: border-box', 'gap: 6px; box-sizing: border-box')
  .replace('style="display: block"', 'style="display: block; height: 220px; max-height: 220px"')
  .replace('padding: 12px;', 'padding: 12px; min-height: 330px;');
const heatBlock = template.slice(heatStart, heatEnd)
  .replace('flex-direction: column; gap: 12px; box-sizing: border-box', 'flex-direction: column; gap: 8px; box-sizing: border-box')
  .replace('padding: 20px;', 'padding: 14px;')
  .replace(/<div style="display: flex; gap: 10px; align-items: baseline">[\s\S]*?<\/div>\n<svg :viewBox/, '<svg :viewBox');
const activityHeatRow = '<div style="display: flex; flex-wrap: wrap; align-items: flex-start; gap: 14px">' + calendarBlock + monthlyBlock + '</div>\n' + heatBlock;
template = template.slice(0, activityRowStart) + activityHeatRow + template.slice(heatEnd);

// Keep the Annual challenge with the rest of the achievement and challenge
// context. It used to be rendered twice (Overview and Achievements), which
// made the Overview feel crowded and left the Achievements section out of
// sequence. Extract the Overview card, remove the old Achievements copy, and
// insert one copy immediately before the live challenge catalogue.
const annualHeading = 'The Annual {{annual.year}} · 20,000 minutes';
const firstAnnualHeading = template.indexOf(annualHeading);
if (firstAnnualHeading < 0) throw new Error("Annual challenge heading was not found");
const overviewStart = template.lastIndexOf('<template v-if="isOverview">', firstAnnualHeading);
const overviewSectionStart = template.indexOf('<section', overviewStart);
const overviewSectionEnd = template.indexOf('</section>', overviewSectionStart);
const overviewEnd = template.indexOf('</section></template>', overviewSectionEnd) + '</section></template>'.length;
if (overviewStart < 0 || overviewSectionStart < 0 || overviewSectionEnd < 0 || overviewEnd < overviewSectionEnd) {
  throw new Error("Overview Annual card boundaries were not found");
}
const annualBlock = template.slice(overviewSectionStart, overviewSectionEnd + '</section>'.length);
template = template.slice(0, overviewStart) + template.slice(overviewEnd);

const remainingAnnualHeading = template.indexOf(annualHeading);
if (remainingAnnualHeading < 0) throw new Error("Achievements Annual card was not found");
const achievementsAnnualStart = template.lastIndexOf('<section', remainingAnnualHeading);
const achievementsAnnualEnd = template.indexOf('</section>', remainingAnnualHeading) + '</section>'.length;
if (achievementsAnnualStart < 0 || achievementsAnnualEnd <= achievementsAnnualStart) {
  throw new Error("Achievements Annual card boundaries were not found");
}
template = template.slice(0, achievementsAnnualStart) + template.slice(achievementsAnnualEnd);

const challengeHeading = 'Active challenges';
const challengeHeadingIndex = template.indexOf(challengeHeading);
const challengeSectionStart = template.lastIndexOf('<section', challengeHeadingIndex);
if (challengeHeadingIndex < 0 || challengeSectionStart < 0) throw new Error("Active challenge section was not found");
template = template.slice(0, challengeSectionStart) + annualBlock + '\n' + template.slice(challengeSectionStart);

// The Overview already exposes the underlying streak and achievement data in
// the other cards, so omit its redundant recent-achievements panel. Keep the
// corresponding Achievements panel intact.
const overviewRecentMarker = 'Milestones, streaks and the Annual';
const overviewRecentIndex = template.indexOf(overviewRecentMarker);
const overviewRecentStart = template.lastIndexOf('<section', overviewRecentIndex);
const overviewRecentEnd = template.indexOf('</section>', overviewRecentIndex) + '</section>'.length;
if (overviewRecentIndex < 0 || overviewRecentStart < 0 || overviewRecentEnd <= overviewRecentStart) {
  throw new Error("Overview recent-achievements panel was not found");
}
template = template.slice(0, overviewRecentStart) + template.slice(overviewRecentEnd);

const milestoneStart = template.indexOf('<template v-if="oneDisc">');
const milestoneEnd = template.indexOf('</template>', milestoneStart) + '</template>'.length;
if (milestoneStart < 0 || milestoneEnd <= milestoneStart) {
  throw new Error("Class length milestones panel was not found");
}
template = template.slice(0, milestoneStart) + template.slice(milestoneEnd);

// Stack Workout time preference under Class length in the same column. Move
// both the populated and empty states together so the layout stays consistent
// when class start-time data is unavailable.
const timeStart = template.indexOf('<template v-if="hasTimes">');
const noTimeStart = template.indexOf('<template v-if="noTimes">', timeStart);
const timeEnd = template.indexOf('</section></template>', noTimeStart) + '</section></template>'.length;
if (timeStart < 0 || noTimeStart < 0 || timeEnd <= noTimeStart) {
  throw new Error("Workout time preference panels were not found");
}
const timeBlock = template.slice(timeStart, timeEnd)
  .replace('grid-template-columns: 150px minmax(0, 1fr) 48px;', 'grid-template-columns: minmax(0, 110px) minmax(24px, 1fr) 32px;');
template = template.slice(0, timeStart) + template.slice(timeEnd);

const classHeading = '<h3 style="margin: 0; font-size: 16px; font-weight: 600">Class length</h3>';
const classHeadingIndex = template.indexOf(classHeading);
const classSectionStart = template.lastIndexOf('<section', classHeadingIndex);
const classSectionEnd = template.indexOf('</section>', classHeadingIndex) + '</section>'.length;
if (classHeadingIndex < 0 || classSectionStart < 0 || classSectionEnd <= classSectionStart) {
  throw new Error("Class length panel was not found");
}
const classSection = template.slice(classSectionStart, classSectionEnd);
const stackedClassColumn = '<div style="flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; gap: 14px">' + classSection + timeBlock + '</div>';
template = template.slice(0, classSectionStart) + stackedClassColumn + template.slice(classSectionEnd);

// The filtered class table is useful as the detailed result view, not just an
// instructor drill-down. Keep it visible on Overview so its rows and count
// respond to every active discipline, class-type, and instructor filter.
const everyClassOpen = '<template v-if="instSel"><section';
const everyClassStart = template.indexOf(everyClassOpen);
if (everyClassStart < 0) throw new Error("Every class panel was not found");
template = template.replace(everyClassOpen, '<section');
const everyClassEnd = template.indexOf('</section></template>', everyClassStart);
if (everyClassEnd < 0) throw new Error("Every class panel terminator was not found");
template = template.slice(0, everyClassEnd) + '</section>' + template.slice(everyClassEnd + '</section></template>'.length);

// Reuse the always-visible class table as the report's workout log. Keep the
// export beside the title so it always reflects the current date and filters.
const everyHeading = '<h3 style="margin: 0; font-size: 16px; font-weight: 600">Every class · {{classCount}} in {{scopeLabel}}</h3>';
if (!template.includes(everyHeading)) throw new Error("Every class heading was not found");
template = template.replace(everyHeading, '<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap"><h3 style="margin: 0; font-size: 16px; font-weight: 600">Workout log · {{classCount}}</h3><button type="button" @click="exportCsv" style="min-height: 38px; padding: 0 12px; border: 1px solid #C9CDD3; border-radius: 999px; background: #FFFFFF; color: #3A5A8C; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer">Export CSV</button></div>');

// Latest workouts is redundant once the filter-aware Every class table is
// always present on Overview.
const latestHeading = '<h3 style="margin: 0; font-size: 16px; font-weight: 600">Top workouts</h3>';
const latestIndex = template.indexOf(latestHeading);
const latestStart = template.lastIndexOf('<section', latestIndex);
const latestEnd = template.indexOf('</section>', latestIndex) + '</section>'.length;
if (latestIndex < 0 || latestStart < 0 || latestEnd <= latestStart) {
  throw new Error("Latest workouts panel was not found");
}
template = template.slice(0, latestStart) + template.slice(latestEnd);

// Keep the header focused on identity and date scope. The manual refresh
// control belongs in the footer so it does not compete with report filters.
const dataPanelRe = /<div style="display: flex; flex-direction: column; gap: 4px">\n<span style="font-size: 11px; font-weight: 600; color: #5B6069; letter-spacing: 0\.6px">DATA<\/span>[\s\S]*?<\/div>\n<template v-if="hasData">/;
if (!dataPanelRe.test(template)) throw new Error('Header data controls were not found');
template = template.replace(dataPanelRe, '<template v-if="hasData">');
const footerMarker = '</div>\n</div>';
const footerIndex = template.lastIndexOf(footerMarker);
if (footerIndex < 0) throw new Error('Report footer boundary was not found');
const footer = '<footer style="max-width: 1360px; margin: 20px auto 0; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; background: #FFFFFF; border: 1px solid #E1E4E8; border-radius: 12px; box-sizing: border-box"><span role="status" style="font-size: 12px; color: #5B6069">{{dataLabel}} <span style="color: #3A5A8C">{{loadMsg}}</span></span><button type="button" @click="onFetch" :aria-busy="fetching" style="min-height: 40px; padding: 0 16px; border-radius: 999px; background: #DF1C2F; border: 0; color: #FFFFFF; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer">{{fetchLabel}}</button></footer>\n';
template = template.slice(0, footerIndex) + footer + template.slice(footerIndex);
template = template.replace(' · {{totalAll}} workouts · {{dataLabel}}', ' · {{totalAll}} workouts');

template = template.replace('>Top workouts<', '>Latest workouts<');
template = template.replace(
  '<template v-for="(b, b_i) in bars"',
  '<template v-if="avgY"><line x1="0" x2="1000" :y1="avgY" :y2="avgY" stroke="#3A5A8C" stroke-width="2" stroke-dasharray="8 6"></line><text x="992" :y="avgY - 6" fill="#3A5A8C" font-size="11" text-anchor="end" font-family="Inter, sans-serif">{{avgLabel}}</text></template><template v-for="(b, b_i) in bars"'
);
const yearControls = (kind, label) => {
  const field = kind === 'Monthly' ? 'monthlyYear' : 'heatmapYear';
  return `<div v-if="isAll" class="chart-year-nav" role="group" aria-label="${label} year"><button class="circle-control chart-year-arrow chart-year-prev" type="button" @click="prev${kind}Year" :disabled="!canPrev${kind}Year" aria-label="Previous year for ${label}" title="Previous year">←</button><span class="chart-year-status" aria-live="polite">{{${field}}}</span><button class="circle-control chart-year-arrow chart-year-next" type="button" @click="next${kind}Year" :disabled="!canNext${kind}Year" aria-label="Next year for ${label}" title="Next year">→</button></div>`;
};
for (const [heading, kind, label] of [['chartTitle', 'Monthly', 'minutes per month'], ['heatTitle', 'Heatmap', 'daily heatmap']]) {
  const h = '<h3 style="margin: 0; font-size: 16px; font-weight: 600">{{' + heading + '}}</h3>';
  if (!template.includes(h)) throw new Error('Year control heading not found: ' + heading);
  const headingIndex = template.indexOf(h);
  const sectionStart = template.lastIndexOf('<section', headingIndex);
  const sectionEnd = template.indexOf('</section>', headingIndex);
  if (sectionStart < 0 || sectionEnd < 0) throw new Error('Year control section not found: ' + heading);
  const section = template.slice(sectionStart, sectionEnd)
    .replace('<section', '<section data-year-chart')
    .replace(h, '<div class="chart-year-heading">' + (kind === 'Heatmap' ? h.replace('{{heatTitle}}', '{{heatTitle}}<span v-if="isAll"> · {{heatmapYear}}</span>') : h) + '</div>' + yearControls(kind, label));
  template = template.slice(0, sectionStart) + section + template.slice(sectionEnd);
}

// An ordinary link remains usable without JavaScript; the scroll listener only
// controls visibility. Keep styles external for the report's existing CSP.
template += '<a class="circle-control back-to-top" href="#report-top" aria-label="Back to top" title="Back to top">↑</a>';

const badgeHeading = 'Special event badges · {{bEarned}} of {{bTotal}} earned';
const badgeHeadingIndex = template.indexOf(badgeHeading);
const badgeSectionStart = template.lastIndexOf('<section', badgeHeadingIndex);
const badgeSectionEnd = template.indexOf('</section>', badgeHeadingIndex);
if (badgeHeadingIndex < 0 || badgeSectionStart < 0 || badgeSectionEnd < 0) throw new Error('Special event badge section was not found');
let badgeSection = template.slice(badgeSectionStart, badgeSectionEnd);
const badgePagerStart = badgeSection.indexOf('<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding-top: 4px">');
if (badgePagerStart < 0) throw new Error('Special event badge pager was not found');
badgeSection = badgeSection.slice(0, badgePagerStart) + `<div class="chart-year-nav" role="group" aria-label="Special event badges year"><button class="circle-control chart-year-arrow chart-year-prev" type="button" @click="badgePageNav.prev" :disabled="!badgePageNav.canPrev" aria-label="Previous year for special event badges" title="Previous year">←</button><span class="chart-year-status" aria-live="polite">{{badgePageNav.year}}</span><button class="circle-control chart-year-arrow chart-year-next" type="button" @click="badgePageNav.next" :disabled="!badgePageNav.canNext" aria-label="Next year for special event badges" title="Next year">→</button></div>`;
badgeSection = badgeSection.replace('<section', '<section data-year-chart')
  .replace('Earned counts come from your latest Peloton update; the full catalogue is from Pelo Buddy’s badge list.', 'Earned counts come from your latest Peloton update.')
  .replace(badgeHeading, 'Special event badges · {{badgePageNav.year}} · {{bEarned}} of {{bTotal}} earned')
  .replace('<div style="display: flex; flex-direction: column; gap: 18px; max-height: 760px; overflow-y: auto; padding-right: 4px">', '<div class="badge-year-body"><p v-if="!badgeGroups.length" role="status" class="badge-empty">No badges in this category for {{badgePageNav.year}}.</p><div class="badge-year-items" style="display: flex; flex-direction: column; gap: 18px; max-height: 760px; overflow-y: auto; padding-right: 4px">');
badgeSection += '</div>';
template = template.slice(0, badgeSectionStart) + badgeSection + template.slice(badgeSectionEnd);

// Apply heading casing only after the structural transforms that locate the
// original headings. Leave Vue expressions and nested markup intact.
template = template.replace('>Discipline milestones<', '>Milestones<');
template = template.replace(/(<h[1-6]\b[^>]*>)([\s\S]*?)(<\/h[1-6]>)/g, (_, open, body, close) =>
  open + body.replace(/(\{\{[\s\S]*?\}\}|<[^>]*>)|([^<{]+)/g, (part, markup, text) =>
    markup || text.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())) + close);

const compiled = compile(template, { mode: "function", prefixIdentifiers: false });
const render = "(function(){" + compiled.code + "})()";
const result = source.slice(0, start) + "    render: " + render + source.slice(valueEnd + 1);
const runtime = "vendor/vue.global.prod.js";
const runtimeOnly = "vendor/vue.runtime.global.prod.js";
const runtimeSource = fs.readFileSync(new URL("../docs/vendor/vue.runtime.global.prod.js", import.meta.url), "utf8");
const externalRuntime = result.replace(runtime, runtimeOnly);
const appMatch = [...externalRuntime.matchAll(/<script(?:\s[^>]*)?>\r?\n([\s\S]*?)\r?\n<\/script>/g)].find((match) => match[1].includes("async fetchLive()"));
if (!appMatch) throw new Error("Compiled report script was not found");
const outputDir = path.dirname(output);
const appPath = path.join(outputDir, "report-app.js");
const scrollControls = `
(function () {
  const link = document.querySelector('.back-to-top');
  if (!link) return;
  let frame = null;
  const update = () => {
    link.classList.toggle('show', window.scrollY > Math.min(600, window.innerHeight * 0.5));
    frame = null;
  };
  window.addEventListener('scroll', () => {
    if (frame === null) frame = window.requestAnimationFrame(update);
  }, { passive: true });
  update();
})();
`;
fs.writeFileSync(appPath, appMatch[1] + "\n" + scrollControls);
const externalApp = externalRuntime.replace(appMatch[0], "<script src=\"report-app.js\"></script>");
const styleMatch = externalApp.match(/<style>\r?\n([\s\S]*?)\r?\n<\/style>/);
if (!styleMatch) throw new Error("Report stylesheet was not found");
const cssPath = path.join(outputDir, "report.css");
const controlStyles = `
html{scroll-behavior:smooth}
.badge-year-items{padding-left:40px;padding-right:40px!important;min-height:100px}.badge-empty{min-height:100px;margin:0;padding:20px 40px;color:#5B6069;font-size:14px}
[data-year-chart]{position:relative}
.circle-control{width:44px;height:44px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:1px solid #C9CDD3;border-radius:50%;background:#FFFFFF;color:#181A1D;box-shadow:0 2px 8px #181a1d26;font:inherit;font-size:24px;text-decoration:none;cursor:pointer;transition:opacity .15s,background .15s,box-shadow .15s}
.circle-control:hover{background:#F4F5F7;box-shadow:0 3px 12px #181a1d38}
.circle-control:focus-visible{outline:2px solid #3A5A8C;outline-offset:3px}
.chart-year-nav{display:contents}
.chart-year-status{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.chart-year-nav .chart-year-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;border-radius:50%;font-size:24px;opacity:0;pointer-events:none}
.chart-year-prev{left:8px}.chart-year-next{right:8px}
.activity-calendar{padding-left:40px!important;padding-right:40px!important}
.activity-calendar h3{margin-left:-28px!important;margin-right:-28px!important}
.activity-calendar .chart-year-prev{left:2px}.activity-calendar .chart-year-next{right:2px}
.activity-calendar .chart-year-arrow{width:36px;height:36px;font-size:20px}
.badge-year-body{position:relative}
.badge-year-body .chart-year-arrow{top:42px}
.badge-year-body .chart-year-prev{left:-12px}.badge-year-body .chart-year-next{right:-12px}
[data-year-chart]:hover .chart-year-arrow,[data-year-chart]:focus-within .chart-year-arrow{opacity:1;pointer-events:auto}
.chart-year-nav .chart-year-arrow:disabled{opacity:0;pointer-events:none}
[data-year-chart]:hover .chart-year-arrow:disabled,[data-year-chart]:focus-within .chart-year-arrow:disabled{opacity:.3;cursor:default}
.back-to-top{position:fixed;right:24px;bottom:24px;z-index:50;opacity:0;visibility:hidden;pointer-events:none}
.back-to-top.show{opacity:1;visibility:visible;pointer-events:auto}
@media(hover:none),(pointer:coarse){.chart-year-nav .chart-year-arrow{opacity:1;pointer-events:auto}.chart-year-nav .chart-year-arrow:disabled{opacity:.3;pointer-events:none}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.circle-control{transition:none}}
`;
fs.writeFileSync(cssPath, styleMatch[1] + "\n" + controlStyles);
const runtimeTag = `<script src=\"${runtimeOnly}\"></script>`;
const externalAssets = externalApp.replace(styleMatch[0], "<link rel=\"stylesheet\" href=\"report.css\">").replace('<body>', '<body id="report-top">');
fs.writeFileSync(output, externalAssets);
