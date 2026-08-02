/**
 * PracticeLevelSelectionNode.ts
 *
 * The first thing the Practice screen shows: pick a level.
 *
 * This is the vegas level-selection user interface, so it looks and behaves the
 * way it does in every other PhET game — one button per level, each carrying the
 * best score reached on it as stars, with the timer toggle and Reset All below.
 * Which levels appear is set by the `gameLevels` query parameter, so a teacher
 * can hand out a link to a single level.
 */

import { PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { Node, type NodeOptions, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton, TimerToggleButton } from "scenerystack/scenery-phet";
import type { Tandem } from "scenerystack/tandem";
import { LevelSelectionButtonGroup, type LevelSelectionButtonGroupItem, ScoreDisplayStars } from "scenerystack/vegas";
import {
  FLAT_BUTTON_APPEARANCE_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../../common/VernierScalesButtonOptions.js";
import { StringManager } from "../../i18n/StringManager.js";
import vernierScalesQueryParameters from "../../preferences/vernierScalesQueryParameters.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import { SCREEN_VIEW_MARGIN } from "../../VernierScalesConstants.js";
import { NUMBER_OF_STARS, PERFECT_SCORE, PracticeLevel, type PracticeModel } from "../model/PracticeModel.js";
import { createLevelIcon } from "./PracticeLevelIcons.js";

/** Size of one level button. Three of them plus their spacing fit the layout width. */
const BUTTON_SIZE = 150;

export class PracticeLevelSelectionNode extends Node {
  /** The level buttons, so focus can be restored to one when a level is left. */
  private readonly buttonGroup: LevelSelectionButtonGroup;

  public constructor(
    model: PracticeModel,
    layoutBounds: Bounds2,
    resetAll: () => void,
    tandem: Tandem,
    providedOptions?: NodeOptions,
  ) {
    super(providedOptions);

    const strings = StringManager.getInstance().getPracticeStrings();
    const a11y = StringManager.getInstance().getPracticeA11yStrings();

    const levelName = (level: PracticeLevel): TReadOnlyProperty<string> => {
      switch (level) {
        case PracticeLevel.METRIC:
          return strings.levels.metricStringProperty;
        case PracticeLevel.IMPERIAL:
          return strings.levels.imperialStringProperty;
        case PracticeLevel.ZERO_ERROR:
          return strings.levels.zeroErrorStringProperty;
        default:
          throw new Error(`Unhandled PracticeLevel: ${level}`);
      }
    };

    const levelDescription = (level: PracticeLevel): TReadOnlyProperty<string> => {
      switch (level) {
        case PracticeLevel.METRIC:
          return strings.levelDescriptions.metricStringProperty;
        case PracticeLevel.IMPERIAL:
          return strings.levelDescriptions.imperialStringProperty;
        case PracticeLevel.ZERO_ERROR:
          return strings.levelDescriptions.zeroErrorStringProperty;
        default:
          throw new Error(`Unhandled PracticeLevel: ${level}`);
      }
    };

    // Ordered by increasing level number, which is what LevelSelectionButtonGroup
    // assumes when it matches buttons to the gameLevels query parameter.
    const levels = PracticeLevel.levelsInOrder();

    const items: LevelSelectionButtonGroupItem[] = levels.map((level) => ({
      icon: createLevelIcon(level),
      scoreProperty: model.bestScoreProperty(level),
      options: {
        ...FLAT_BUTTON_APPEARANCE_OPTIONS,
        baseColor: VernierScalesColors.controlSurfaceColorProperty,
        createScoreDisplay: (scoreProperty) =>
          new ScoreDisplayStars(scoreProperty, {
            numberOfStars: NUMBER_OF_STARS,
            perfectScore: PERFECT_SCORE,
          }),
        accessibleName: new PatternStringProperty(a11y.controls.levelButtonPatternStringProperty, {
          number: level.levelNumber,
          name: levelName(level),
        }),
        accessibleHelpText: a11y.controls.levelButtonHelpStringProperty,
        listener: () => model.startLevel(level),
      },
    }));

    const buttonGroup = new LevelSelectionButtonGroup(items, {
      groupButtonWidth: BUTTON_SIZE,
      groupButtonHeight: BUTTON_SIZE,
      flowBoxOptions: { spacing: 26 },
      gameLevels: vernierScalesQueryParameters.gameLevels,
      tandem: tandem.createTandem("levelSelectionButtonGroup"),
    });
    this.buttonGroup = buttonGroup;

    // The name and the one-line description sit under each button rather than on
    // it: the button face is the icon and the stars, as in every PhET game, and a
    // wall of text there would crowd them out. Buttons excluded by `gameLevels`
    // are hidden rather than omitted, so each caption follows its button.
    const captions = new Node({
      children: levels.map((level, index) => {
        const button = buttonGroup.buttons[index];
        if (button === undefined) {
          throw new Error(`No level-selection button for level ${level.levelNumber}`);
        }
        return new VBox({
          spacing: 2,
          maxWidth: BUTTON_SIZE + 20,
          visibleProperty: button.visibleProperty,
          children: [
            new Text(levelName(level), {
              font: new PhetFont({ size: 15, weight: "bold" }),
              fill: VernierScalesColors.textColorProperty,
            }),
            new Text(levelDescription(level), {
              font: new PhetFont(12),
              fill: VernierScalesColors.textColorProperty,
            }),
          ],
          centerX: button.centerX,
          top: buttonGroup.bottom + 10,
        });
      }),
    });

    const title = new Text(strings.chooseYourLevelStringProperty, {
      font: new PhetFont({ size: 28, weight: "bold" }),
      fill: VernierScalesColors.textColorProperty,
      maxWidth: 500,
    });

    const content = new VBox({
      spacing: 34,
      children: [title, new Node({ children: [buttonGroup, captions] })],
      centerX: layoutBounds.centerX,
      centerY: layoutBounds.centerY - 20,
    });
    this.addChild(content);

    const timerToggleButton = new TimerToggleButton(model.timerEnabledProperty, {
      ...FLAT_BUTTON_APPEARANCE_OPTIONS,
      baseColor: VernierScalesColors.controlSurfaceColorProperty,
      left: SCREEN_VIEW_MARGIN,
      bottom: layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(timerToggleButton);

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: resetAll,
      right: layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);

    this.pdomOrder = [buttonGroup, timerToggleButton, resetAllButton];
  }

  /**
   * Put focus back on a level's button. Called when a level is left, so that a
   * keyboard user lands where they started rather than at the top of the screen.
   */
  public focusLevelButton(level: PracticeLevel): void {
    this.buttonGroup.focusLevelSelectionButton(level.levelNumber);
  }
}
