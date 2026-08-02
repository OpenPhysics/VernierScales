/**
 * PracticeStatusBar.ts
 *
 * The band across the top of a level in play: which level, which challenge of how
 * many, the score, the clock, and the way back out.
 *
 * This is vegas's {@link FiniteStatusBar} with the sim's palette applied. The bar
 * spans the visible bounds rather than the layout bounds, so it keeps reaching the
 * window edges at any aspect ratio — which is why it is a separate node the screen
 * layers above everything else rather than part of the challenge layout.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { PhetFont } from "scenerystack/scenery-phet";
import { FiniteStatusBar } from "scenerystack/vegas";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/VernierScalesButtonOptions.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import type { PracticeModel } from "../model/PracticeModel.js";

export class PracticeStatusBar extends FiniteStatusBar {
  /** Height of the bar; the challenge layout starts below it. Matches the vegas default. */
  public static readonly BAR_HEIGHT = 50;

  public constructor(
    model: PracticeModel,
    layoutBounds: Bounds2,
    visibleBoundsProperty: TReadOnlyProperty<Bounds2>,
    startOver: () => void,
  ) {
    super(layoutBounds, visibleBoundsProperty, model.scoreProperty, {
      barFill: VernierScalesColors.panelBackgroundColorProperty,
      barStroke: VernierScalesColors.panelBorderColorProperty,
      font: new PhetFont(18),
      textFill: VernierScalesColors.textColorProperty,
      levelNumberProperty: model.levelNumberProperty,
      challengeNumberProperty: model.challengeNumberProperty,
      numberOfChallengesProperty: model.numberOfChallengesProperty,
      elapsedTimeProperty: model.gameTimer.elapsedTimeProperty,
      timerEnabledProperty: model.timerEnabledProperty,
      startOverButtonOptions: {
        ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
        textFill: LIGHT_SURFACE_TEXT_FILL,
        font: new PhetFont(15),
        listener: startOver,
      },
    });
  }
}
