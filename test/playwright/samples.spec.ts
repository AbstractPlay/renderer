import { expect, test } from "@playwright/test";
import samples from "../fixtures/playground-samples.json";
import { assertRenderHealth } from "./render-health";

const sampleKeys = Object.keys(samples);

for (const sampleKey of sampleKeys) {
    test(`${sampleKey} renders cleanly`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(err.message));
        page.on("console", (msg) => {
            if (msg.type() === "error") {
                errors.push(msg.text());
            }
        });

        await page.goto(`/harness.html?sample=${encodeURIComponent(sampleKey)}`);
        await page.waitForSelector('[data-rendered="true"] #drawing svg', { timeout: 15_000 });

        const structural = await page.evaluate(assertRenderHealth);
        expect(structural.ok, structural.message).toBe(true);
        expect(errors, errors.join("\n")).toEqual([]);
    });
}
