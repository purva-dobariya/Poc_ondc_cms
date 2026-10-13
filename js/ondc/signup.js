/* ONDC — sign-up CTAs redirect straight to the ONDC network onboarding portal
   instead of opening an in-page modal.

   Public API: ONDCSignup.open() */
(function () {
  "use strict";

  var PORTAL_URL = "https://portal.ondc.org/";

  function open() {
    window.open(PORTAL_URL, "_blank", "noopener");
  }

  window.ONDCSignup = { open: open };
})();
