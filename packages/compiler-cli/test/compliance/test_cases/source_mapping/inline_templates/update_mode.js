// NOTE: Creation mode
i0.ɵɵelementStart(0, "div") // SOURCE: "/update_mode.ts" <div>
…
i0.ɵɵtext(1, "this is a test") // SOURCE: "/update_mode.ts" this is a test
…
i0.ɵɵelementEnd() // SOURCE: "/update_mode.ts" </div>
…
i0.ɵɵelementStart(2, "div") // SOURCE: "/update_mode.ts" <div>
…
i0.ɵɵtext(3) // SOURCE: "/update_mode.ts" {{ 1 + 2 }}
…
i0.ɵɵelementEnd() // SOURCE: "/update_mode.ts" </div>
…
// NOTE: Update mode
i0.ɵɵtextInterpolate(1 + 2) // SOURCE: "/update_mode.ts" {{ 1 + 2 }}
