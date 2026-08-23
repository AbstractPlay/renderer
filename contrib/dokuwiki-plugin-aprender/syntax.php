<?php

/**
 * Syntax plugin for embedding Abstract Play renderer JSON.
 *
 * Usage:
 *   <aprender settings='{"colourContext":{...}}'>
 *   { "board": ... }
 *   </aprender>
 *
 * Optional layout attributes on the opening tag:
 *   rotate="90" colourblind width="100%" height="400" scale="50%"
 *
 * @license MIT
 */
class syntax_plugin_aprender extends DokuWiki_Syntax_Plugin
{
    public function getType()
    {
        return 'protected';
    }

    public function getPType()
    {
        return 'block';
    }

    public function getSort()
    {
        return 305;
    }

    /**
     * @param string $mode
     */
    public function connectTo($mode)
    {
        $this->Lexer->addSpecialPattern(
            '<aprender\\s*[^>]*>.*?</aprender>',
            $mode,
            'plugin_aprender'
        );
    }

    /**
     * @param string $match
     * @param int $state
     * @param int $pos
     * @param Doku_Handler $handler
     * @return array<string, mixed>|false
     */
    public function handle($match, $state, $pos, Doku_Handler $handler)
    {
        if ($state !== DOKU_LEXER_SPECIAL) {
            return false;
        }

        if (!preg_match('/^<aprender(\s[^>]*)?>\s*(.*?)\s*<\/aprender>$/is', $match, $parts)) {
            return ['error' => $this->getLang('json_invalid')];
        }

        $attrString = trim($parts[1]);
        $body = $parts[2];
        $parseResult = $this->parseAttributes($attrString);
        if (isset($parseResult['error'])) {
            return ['error' => $parseResult['error']];
        }

        $options = $parseResult['options'];
        $maxBytes = (int) $this->getConf('max_json_bytes');
        $trimmed = trim($body);
        $payloadBytes = strlen($trimmed);

        if (isset($options['_settingsRaw'])) {
            $payloadBytes += strlen((string) $options['_settingsRaw']);
        }

        if ($payloadBytes > $maxBytes) {
            return [
                'error' => sprintf($this->getLang('json_too_large'), $maxBytes),
            ];
        }

        if (isset($options['_settingsRaw'])) {
            $settings = json_decode($options['_settingsRaw'], true);
            unset($options['_settingsRaw']);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($settings)) {
                $message = $this->getLang('settings_invalid');
                $detail = json_last_error_msg();
                if ($detail !== 'No error') {
                    $message .= ': ' . $detail;
                }
                return ['error' => $message];
            }

            if ($this->isList($settings)) {
                return ['error' => $this->getLang('settings_not_object')];
            }

            $options['settings'] = $settings;
        }

        $json = json_decode($trimmed, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($json)) {
            $message = $this->getLang('json_invalid');
            $detail = json_last_error_msg();
            if ($detail !== 'No error') {
                $message .= ': ' . $detail;
            }
            return ['error' => $message];
        }

        if ($this->isList($json)) {
            return ['error' => $this->getLang('json_not_object')];
        }

        return [
            'json' => $json,
            'options' => $options,
        ];
    }

    /**
     * @param string $format
     * @param Doku_Renderer $renderer
     * @param array<string, mixed> $data
     * @return bool
     */
    public function render($format, Doku_Renderer $renderer, $data)
    {
        if ($format !== 'xhtml') {
            return false;
        }

        if (isset($data['error'])) {
            $renderer->doc .= $this->errorBox((string) $data['error']);
            return true;
        }

        if (!isset($data['json']) || !is_array($data['json'])) {
            $renderer->doc .= $this->errorBox($this->getLang('json_invalid'));
            return true;
        }

        $options = isset($data['options']) && is_array($data['options']) ? $data['options'] : [];

        /** @var helper_plugin_aprender $helper */
        $helper = plugin_load('helper', 'aprender');
        $renderer->doc .= $helper->buildInstanceHtml($data['json'], $options);

        return true;
    }

    /**
     * @return array{options: array<string, mixed>, error?: string}
     */
    protected function parseAttributes(string $attrString): array
    {
        $options = [];

        if ($attrString === '') {
            return ['options' => $options];
        }

        $settingsRaw = $this->extractSettingsAttribute($attrString);
        if ($settingsRaw !== null) {
            $options['_settingsRaw'] = $settingsRaw;
            $attrString = $this->removeSettingsAttribute($attrString);
        }

        if (preg_match('/\brotate=(["\']?)(-?\d+)\1/i', $attrString, $match)) {
            $options['rotate'] = (int) $match[2];
        }

        if (preg_match('/\bwidth=(["\'])([^"\']+)\1/i', $attrString, $match)) {
            $options['width'] = $match[2];
        } elseif (preg_match('/\bwidth=([^\s>]+)/i', $attrString, $match)) {
            $options['width'] = $match[1];
        }

        if (preg_match('/\bheight=(["\'])([^"\']+)\1/i', $attrString, $match)) {
            $options['height'] = $match[2];
        } elseif (preg_match('/\bheight=([^\s>]+)/i', $attrString, $match)) {
            $options['height'] = $match[1];
        }

        if (preg_match('/\bcolourblind\b/i', $attrString)) {
            $options['colourBlind'] = true;
        }

        if (preg_match('/\bscale=(["\']?)([^"\'\s>]+)\1/i', $attrString, $match)) {
            $options['scale'] = $match[2];
        }

        return ['options' => $options];
    }

    /**
     * Extract the raw JSON string from a settings='...' or settings="..." attribute.
     */
    protected function extractSettingsAttribute(string $attrString): ?string
    {
        if (preg_match('/\bsettings=\'([^\']*)\'/is', $attrString, $match)) {
            return $match[1];
        }

        if (preg_match('/\bsettings="([^"]*)"/is', $attrString, $match)) {
            return $match[1];
        }

        return null;
    }

    protected function removeSettingsAttribute(string $attrString): string
    {
        $attrString = preg_replace('/\bsettings=\'[^\']*\'/is', '', $attrString);
        if ($attrString === null) {
            return '';
        }

        $attrString = preg_replace('/\bsettings="[^"]*"/is', '', $attrString);
        if ($attrString === null) {
            return '';
        }

        return trim($attrString);
    }

    /**
     * @param array<mixed> $value
     */
    protected function isList(array $value): bool
    {
        if ($value === []) {
            return false;
        }

        return array_keys($value) === range(0, count($value) - 1);
    }

    protected function errorBox(string $message): string
    {
        return '<pre class="aprender-error">' . hsc($message) . '</pre>';
    }
}
