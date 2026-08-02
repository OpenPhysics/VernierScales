/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { CaliperScreen } from "./caliper/CaliperScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { InstrumentsScreen } from "./instruments/InstrumentsScreen.js";
import { PracticeScreen } from "./practice/PracticeScreen.js";
import { VernierScalesPreferencesModel } from "./preferences/VernierScalesPreferencesModel.js";
import { VernierScalesPreferencesNode } from "./preferences/VernierScalesPreferencesNode.js";
import { VernierPrincipleScreen } from "./principle/VernierPrincipleScreen.js";
import VernierScalesColors from "./VernierScalesColors.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from vernierScalesQueryParameters.
  const simPreferences = new VernierScalesPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new VernierPrincipleScreen(simPreferences, {
      name: stringManager.getScreenNames().principleStringProperty,
      tandem: Tandem.ROOT.createTandem("principleScreen"),
      backgroundColorProperty: VernierScalesColors.backgroundColorProperty,
    }),
    new CaliperScreen(simPreferences, {
      name: stringManager.getScreenNames().caliperStringProperty,
      tandem: Tandem.ROOT.createTandem("caliperScreen"),
      backgroundColorProperty: VernierScalesColors.backgroundColorProperty,
    }),
    new InstrumentsScreen(simPreferences, {
      name: stringManager.getScreenNames().instrumentsStringProperty,
      tandem: Tandem.ROOT.createTandem("instrumentsScreen"),
      backgroundColorProperty: VernierScalesColors.backgroundColorProperty,
    }),
    new PracticeScreen(simPreferences, {
      name: stringManager.getScreenNames().practiceStringProperty,
      tandem: Tandem.ROOT.createTandem("practiceScreen"),
      backgroundColorProperty: VernierScalesColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new VernierScalesPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
