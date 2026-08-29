/**
 * SEO global — JSON-LD Organisation + WebSite (Electro DZ / SwissDZ)
 */
(function () {
  var SITE = "https://electro-dz.com";
  var ICON = SITE + "/assets/app-icon.png";

  var org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": SITE + "/#organization",
    name: "Electro DZ",
    alternateName: ["SwissDZ", "Electro DZ CH", "electro-dz"],
    url: SITE,
    logo: ICON,
    image: ICON,
    description:
      "La grande plateforme algérienne de l'électricité — l'expérience suisse. Calculs pro, normes PDF, schémas IEC, formation et devis pour électriciens.",
    sameAs: [
      "https://www.facebook.com/share/1TXqM56Ncd/",
      "https://www.tiktok.com/@elektrodzch",
      "https://www.youtube.com/@Elektro-dz-suisse",
      "https://play.google.com/store/apps/details?id=com.electrodz.app",
      "https://apps.apple.com/ch/app/electrodz/id6752301246",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: "+213-555-429-960",
      availableLanguage: ["French", "Arabic"],
      url: SITE + "/support.html",
    },
  };

  var website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE + "/#website",
    name: "Electro DZ",
    alternateName: "SwissDZ",
    url: SITE,
    publisher: { "@id": SITE + "/#organization" },
    inLanguage: ["fr", "ar"],
    potentialAction: {
      "@type": "SearchAction",
      target: SITE + "/bibliotheque.html?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  function inject(id, data) {
    if (document.getElementById(id)) return;
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  inject("seo-jsonld-org", org);
  inject("seo-jsonld-website", website);
})();
