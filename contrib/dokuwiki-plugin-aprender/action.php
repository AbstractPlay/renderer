<?php

/**
 * Legacy action component for the aprender plugin.
 *
 * Bundle injection and instance data now live in the page body (see helper.php).
 * This file remains so upgrades replace older action.php versions that hooked
 * TPL_METAHEADER_OUTPUT.
 *
 * @license MIT
 */
class action_plugin_aprender extends DokuWiki_Action_Plugin
{
    /**
     * @param Doku_Event_Handler $controller
     */
    public function register(Doku_Event_Handler $controller)
    {
        // Intentionally empty — rendering is handled in syntax.php + helper.php.
    }
}
