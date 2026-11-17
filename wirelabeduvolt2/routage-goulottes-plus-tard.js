/* Méthode de câblage mise de côté — WireLab EduVolt
   Canalisation sous goulottes (châssis, porte, charnière, extérieur) + Bézier.
   Remettre plus tard : remplacer computeEduVoltRoute dans index.restore.html
   par computeEduVoltRouteGoulottes, et recopier DUCTS_H / DUCTS_V.
   Non chargé par la page.
*/
    /* =========================================================================
       ROUTAGE OFFICIEL EDUVOLT : Canalisation sous Goulotte & Courbure Bézier
       D'après le binaire REA : 'Placa de montaje, canaletas, cableado oculto'
       ========================================================================= */
    const DUCTS_H = [
      { y: 30 + 24, top: 30, bottom: 78 },
      { y: 330 + 24, top: 330, bottom: 378 },
      { y: 630 + 24, top: 630, bottom: 678 }
    ];
    const DUCTS_V = [
      { x: 24 + 24, left: 24, right: 72 },
      { x: 780 + 24, left: 780, right: 828 }
    ];

    function findClosestDuctH(y, dir) {
      if (dir === "top") {
        const cands = DUCTS_H.filter(d => d.y < y);
        if (cands.length) return cands[cands.length - 1];
      } else if (dir === "bottom") {
        const cands = DUCTS_H.filter(d => d.y > y);
        if (cands.length) return cands[0];
      }
      let best = DUCTS_H[0], minD = Math.abs(y - DUCTS_H[0].y);
      for (const d of DUCTS_H) {
        const dist = Math.abs(y - d.y);
        if (dist < minD) { minD = dist; best = d; }
      }
      return best;
    }

    function getComponentPlacementZone(pt) {
      const x = pt.x, y = pt.y;
      // Châssis armoire intérieure
      if (x >= 24 && x <= 804 && y >= 30 && y <= 678) return "chassis";
      // Porte d'armoire intérieure (déployée à plat à droite)
      if (x > 804 && x <= 1620 && y >= 30 && y <= 678) return "door";
      // En dehors du tableau (moteur au sol, boutonnerie déportée, capteurs, atelier)
      return "outside";
    }

    function computeEduVoltRouteGoulottes(A, B, wire) {
      if (wire && wire.waypoints && wire.waypoints.length) {
        return [{ x: A.x, y: A.y }, ...wire.waypoints, { x: B.x, y: B.y }];
      }

      const zoneA = getComponentPlacementZone(A);
      const zoneB = getComponentPlacementZone(B);

      // =======================================================================
      // CAS 1 : CÂBLAGE LIBRE EN DEHORS DU TABLEAU
      // Si l'un des deux composants est hors tableau (moteur déporté, alimentation, bouton extérieur)
      // -> Câblage direct libre avec courbure souple naturelle (sans contrainte de goulotte)
      // =======================================================================
      if (zoneA === "outside" || zoneB === "outside") {
        const pts = [{ x: A.x, y: A.y }];
        const stubAY = (A.dir === "top") ? (A.y - 30) : (A.y + 30);
        const stubBY = (B.dir === "top") ? (B.y - 30) : (B.y + 30);
        pts.push({ x: A.x, y: stubAY });

        // Point de passage intermédiaire souple (courbe aérienne d'atelier)
        const midX = (A.x + B.x) / 2;
        const midY = (stubAY + stubBY) / 2;
        // Légère cambrure naturelle du câble
        const curveSag = Math.min(45, Math.abs(B.x - A.x) * 0.12);
        pts.push({ x: midX, y: midY + curveSag });

        pts.push({ x: B.x, y: stubBY });
        pts.push({ x: B.x, y: B.y });
        return pts;
      }

      // =======================================================================
      // CAS 2 : RACCORDEMENT ENTRE BOUTONS SUR LA PORTE INTÉRIEURE
      // Reste strictement collé sur la tôle intérieure de la porte sans retour aux goulottes
      // =======================================================================
      if (zoneA === "door" && zoneB === "door") {
        const pts = [{ x: A.x, y: A.y }];
        const stubAY = (A.dir === "top") ? (A.y - 22) : (A.y + 22);
        const stubBY = (B.dir === "top") ? (B.y - 22) : (B.y + 22);
        pts.push({ x: A.x, y: stubAY });

        // Cheminement en faisceau collé au dos de porte
        const midDoorY = (stubAY + stubBY) / 2;
        pts.push({ x: A.x, y: midDoorY });
        pts.push({ x: B.x, y: midDoorY });
        pts.push({ x: B.x, y: stubBY });
        pts.push({ x: B.x, y: B.y });
        return pts;
      }

      // =======================================================================
      // CAS 3 : LIAISON CHÂSSIS <-> PORTE INTÉRIEURE (Passage de Charnière Flexible)
      // Canalisation dans les goulottes du tableau jusqu'au flanc droit (charnière x: 804)
      // puis cheminement propre collé sur la porte
      // =======================================================================
      if ((zoneA === "chassis" && zoneB === "door") || (zoneA === "door" && zoneB === "chassis")) {
        const cPt = (zoneA === "chassis") ? A : B;
        const dPt = (zoneA === "chassis") ? B : A;
        const ductC = findClosestDuctH(cPt.y, cPt.dir);
        
        const pts = [];
        const stubCY = (cPt.dir === "top") ? (cPt.y - 25) : (cPt.y + 25);
        const stubDY = (dPt.dir === "top") ? (dPt.y - 22) : (dPt.y + 22);

        // Sortie borne châssis -> goulotte horizontale -> goulotte verticale droite (charnière)
        const hingeX = 804; // Axe charnière industrielle
        const hingePassY = ductC.y;

        if (zoneA === "chassis") {
          pts.push({ x: A.x, y: A.y });
          pts.push({ x: A.x, y: stubCY });
          pts.push({ x: A.x, y: ductC.y });
          pts.push({ x: hingeX, y: hingePassY }); // Traversée de charnière souple
          pts.push({ x: dPt.x, y: hingePassY }); // Fil collé sur la porte
          pts.push({ x: dPt.x, y: stubDY });
          pts.push({ x: dPt.x, y: dPt.y });
        } else {
          pts.push({ x: A.x, y: A.y });
          pts.push({ x: A.x, y: stubDY });
          pts.push({ x: A.x, y: hingePassY });
          pts.push({ x: hingeX, y: hingePassY }); // Traversée charnière
          pts.push({ x: cPt.x, y: ductC.y });
          pts.push({ x: cPt.x, y: stubCY });
          pts.push({ x: cPt.x, y: cPt.y });
        }
        return pts;
      }

      // =======================================================================
      // CAS 4 : DANS LE TABLEAU (CHÂSSIS <-> CHÂSSIS)
      // On garde 100% le principe officiel EduVolt : canalisation sous goulottes
      // =======================================================================
      const ductA = findClosestDuctH(A.y, A.dir);
      const ductB = findClosestDuctH(B.y, B.dir);

      const pts = [{ x: A.x, y: A.y }];
      const stubAY = (A.dir === "top") ? (A.y - 25) : (A.y + 25);
      pts.push({ x: A.x, y: stubAY });

      if (A.dir === "bottom" && ductA.y < A.y) {
        const sideX = A.x + 35;
        pts.push({ x: sideX, y: stubAY });
        pts.push({ x: sideX, y: ductA.y });
      } else {
        pts.push({ x: A.x, y: ductA.y });
      }

      if (ductA === ductB) {
        pts.push({ x: B.x, y: ductA.y });
      } else {
        const vertDuct = (Math.abs(A.x - DUCTS_V[0].x) + Math.abs(B.x - DUCTS_V[0].x)) <
                         (Math.abs(A.x - DUCTS_V[1].x) + Math.abs(B.x - DUCTS_V[1].x))
                         ? DUCTS_V[0] : DUCTS_V[1];

        pts.push({ x: vertDuct.x, y: ductA.y });
        pts.push({ x: vertDuct.x, y: vertDuct.y || ductB.y });
        pts.push({ x: B.x, y: ductB.y });
      }

      const stubBY = (B.dir === "top") ? (B.y - 25) : (B.y + 25);
      pts.push({ x: B.x, y: stubBY });
      pts.push({ x: B.x, y: B.y });
      return pts;
    }

