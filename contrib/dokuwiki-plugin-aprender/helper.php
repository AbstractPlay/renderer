<?php

/**
 * Helper for the aprender plugin.
 *
 * Builds per-instance markup in the page body. DokuWiki emits JSINFO and the
 * page header before tpl_content() runs, so instance data cannot rely on
 * TPL_METAHEADER_OUTPUT or JSINFO.
 *
 * @license MIT
 */
class helper_plugin_aprender extends DokuWiki_Plugin
{
    /** @var int */
    protected $counter = 0;

    /** @var bool */
    protected $bundleEmitted = false;

    /**
     * Build HTML for one render instance, including the bundle script on first use.
     *
     * @param array<string, mixed> $json Parsed render JSON
     * @param array<string, mixed> $options Renderer options from tag attributes
     */
    public function buildInstanceHtml(array $json, array $options): string
    {
        global $ID;

        $this->counter++;
        $pageId = $this->pageSlug($ID);
        $id = 'aprender-' . $pageId . '-' . $this->counter;

        $jsonText = json_encode($json, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE);
        if ($jsonText === false) {
            return $this->errorBox($this->getLang('json_invalid'));
        }

        $optionsText = json_encode($options, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE);
        if ($optionsText === false) {
            $optionsText = '{}';
        }

        $html = '';

        if (!$this->bundleEmitted) {
            $this->bundleEmitted = true;
            $bundleUrl = $this->getConf('bundleUrl');
            $html .= '<script defer src="' . hsc($bundleUrl) . '" id="aprender-bundle"></script>';
        }

        $html .= '<script type="application/json" class="aprender-data" id="' . hsc($id) . '-data">';
        $html .= $jsonText;
        $html .= '</script>';
        $html .= '<script type="application/json" class="aprender-options" id="' . hsc($id) . '-options">';
        $html .= $optionsText;
        $html .= '</script>';
        $html .= '<div ' . $this->frameAttributes($options) . '>';
        $html .= '<div class="aprender" id="' . hsc($id) . '" role="img" aria-label="'
            . hsc($this->getLang('aria_label')) . '"></div>';
        $html .= '</div>';

        return $html;
    }

    /**
     * @deprecated Kept for compatibility with older plugin versions.
     */
    public function hasInstances(): bool
    {
        return $this->counter > 0;
    }

    /**
     * @deprecated Instance data is embedded in the page body, not JSINFO.
     *
     * @return array{}
     */
    public function getJSINFO(): array
    {
        return [];
    }

    /**
     * Build class and inline style for the sizing frame around the render target.
     *
     * @param array<string, mixed> $options
     */
    protected function frameAttributes(array $options): string
    {
        $classes = ['aprender-frame'];
        $styles = [];

        if (!empty($options['width'])) {
            $classes[] = 'aprender-has-width';
            $styles[] = 'width:' . $this->normalizeCssSize((string) $options['width'], 'width');
        }

        if (!empty($options['height'])) {
            $classes[] = 'aprender-has-height';
            $styles[] = 'height:' . $this->normalizeCssSize((string) $options['height'], 'height');
        }

        if (!empty($options['scale'])) {
            $classes[] = 'aprender-has-scale';
            $styles[] = 'transform:scale(' . $this->normalizeScale((string) $options['scale']) . ')';
            $styles[] = 'transform-origin:top left';
        }

        $attrs = 'class="' . hsc(implode(' ', $classes)) . '"';
        if ($styles !== []) {
            $attrs .= ' style="' . hsc(implode(';', $styles)) . '"';
        }

        return $attrs;
    }

    /**
     * Bare numbers become pixels. Height percentages become viewport height (vh)
     * because article content has no definite height for % to resolve against.
     *
     * @param 'width'|'height' $axis
     */
    protected function normalizeCssSize(string $value, string $axis = 'width'): string
    {
        $value = trim($value);
        if (preg_match('/^\d+$/', $value)) {
            return $value . 'px';
        }

        if ($axis === 'height' && preg_match('/^(\d+(?:\.\d+)?)%$/', $value, $match)) {
            return $match[1] . 'vh';
        }

        return $value;
    }

    protected function normalizeScale(string $value): string
    {
        $value = trim($value);
        if (preg_match('/^\d+$/', $value)) {
            return ((float) $value) / 100 . '';
        }

        if (preg_match('/^(\d+(?:\.\d+)?)%$/', $value, $match)) {
            return ((float) $match[1]) / 100 . '';
        }

        return $value;
    }

    /**
     * Normalize a wiki page ID for use in HTML element IDs.
     */
    protected function pageSlug(string $pageId): string
    {
        $slug = preg_replace('/[^a-z0-9_-]+/i', '-', $pageId);
        if ($slug === null || $slug === '') {
            return 'page';
        }

        return strtolower($slug);
    }

    protected function errorBox(string $message): string
    {
        return '<pre class="aprender-error">' . hsc($message) . '</pre>';
    }
}
