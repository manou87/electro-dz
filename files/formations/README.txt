Dossier des futures formations vidéo (Algérie)
==============================================

Placez ici les fichiers publiés sur le site :
  - videos/     → fichiers .mp4 ou liens YouTube à référencer dans data/formations.json
  - supports/   → PDF de cours, fiches, exercices

Le catalogue affiché sur formations.html est piloté par :
  - data/formations.json   (modules vidéo « Algérie »)
  - data/livres.json       (PDF catégorie « formation », déjà listés automatiquement)

Après ajout d’un module, éditez data/formations.json, par exemple :

  {
    "id": "install-dom-dz-01",
    "titleFr": "Installation domestique — partie 1",
    "titleAr": "تركيب منزلي — الجزء 1",
    "type": "video",
    "videoUrl": "files/formations/videos/install-dom-dz-01.mp4",
    "thumb": "assets/covers/formations/install-dom-dz-01.jpg",
    "lang": ["fr", "ar"],
    "country": "DZ",
    "featured": true
  }

Puis commit + push du site (dépôt website/).
