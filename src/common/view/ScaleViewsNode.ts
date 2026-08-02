/**
 * ScaleViewsNode.ts
 *
 * The pair of scale views every screen shows: the whole vernier at a readable
 * zoom, and a magnified window on the region around the coincident line.
 *
 * The pairing is the sim's answer to a real perceptual problem. One vernier
 * division differs from one main division by 1/n — two percent on a 0.02 mm
 * caliper — which no zoom level makes obvious between two adjacent marks. The
 * wide view is where you see the marks converge and splay apart again, which is
 * what actually identifies the coincidence; the magnified view is where you
 * confirm which mark it was. Neither alone is enough, so this node bundles them.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { Node, Text, VBox, type VBoxOptions } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import {
  FULL_SCALE_VIEW_HEIGHT,
  MAGNIFIED_VIEW_HEIGHT,
  MAGNIFIED_WINDOW_DIVISIONS,
  SCALE_VIEW_WIDTH,
} from "../../VernierScalesConstants.js";
import type { VernierScaleModel } from "../model/VernierScaleModel.js";
import { VernierScaleNode, WindowAnchor } from "./VernierScaleNode.js";

type SelfOptions = {
  /** Whether the wide view can be dragged. The magnified view never is. */
  interactive?: boolean;

  /** Controls whether the magnified view is shown. */
  magnifiedVisibleProperty?: TReadOnlyProperty<boolean> | null;

  /** Accessible name for the draggable wide view. */
  dragAccessibleName?: TReadOnlyProperty<string> | null;

  /** Accessible help text for the draggable wide view. */
  dragAccessibleHelpText?: TReadOnlyProperty<string> | null;

  /** Controls the guide line drawn through the coincident tick in both views. */
  coincidenceMarkerVisibleProperty?: TReadOnlyProperty<boolean> | null;

  /** Whether the aligned tick is coloured in. False where finding it is the task. */
  highlightCoincidence?: boolean;
};

export type ScaleViewsNodeOptions = SelfOptions & VBoxOptions;

export class ScaleViewsNode extends VBox {
  /** The wide view of the whole vernier; the one that accepts input. */
  public readonly fullView: VernierScaleNode;

  /** The magnified window on the coincidence. */
  public readonly magnifiedView: VernierScaleNode;

  public constructor(model: VernierScaleModel, providedOptions?: ScaleViewsNodeOptions) {
    const options = optionize<ScaleViewsNodeOptions, SelfOptions, VBoxOptions>()(
      {
        interactive: true,
        magnifiedVisibleProperty: null,
        dragAccessibleName: null,
        dragAccessibleHelpText: null,
        coincidenceMarkerVisibleProperty: null,
        highlightCoincidence: true,
        spacing: 18,
        align: "left",
      },
      providedOptions,
    );

    const common = StringManager.getInstance().getCommonStrings();

    const fullView = new VernierScaleNode(model, {
      viewWidth: SCALE_VIEW_WIDTH,
      viewHeight: FULL_SCALE_VIEW_HEIGHT,
      windowMainDivisions: "fit",
      anchor: WindowAnchor.VERNIER,
      interactive: options.interactive,
      dragAccessibleName: options.dragAccessibleName,
      dragAccessibleHelpText: options.dragAccessibleHelpText,
      coincidenceMarkerVisibleProperty: options.coincidenceMarkerVisibleProperty,
      highlightCoincidence: options.highlightCoincidence,
    });

    const magnifiedView = new VernierScaleNode(model, {
      viewWidth: SCALE_VIEW_WIDTH,
      viewHeight: MAGNIFIED_VIEW_HEIGHT,
      windowMainDivisions: MAGNIFIED_WINDOW_DIVISIONS,
      anchor: WindowAnchor.COINCIDENCE,
      interactive: false,
      coincidenceMarkerVisibleProperty: options.coincidenceMarkerVisibleProperty,
      highlightCoincidence: options.highlightCoincidence,
    });

    const magnifiedGroup = new Node({
      children: [
        new VBox({
          spacing: 4,
          align: "left",
          children: [
            new Text(common.magnifiedStringProperty, {
              font: new PhetFont(13),
              fill: VernierScalesColors.textColorProperty,
            }),
            magnifiedView,
          ],
        }),
      ],
      ...(options.magnifiedVisibleProperty !== null && { visibleProperty: options.magnifiedVisibleProperty }),
    });

    options.children = [fullView, magnifiedGroup];
    super(options);

    this.fullView = fullView;
    this.magnifiedView = magnifiedView;
  }

  /** The focusable node inside the wide view, for a screen's pdomOrder. */
  public get dragTarget(): Node | null {
    return this.fullView.getDragTarget();
  }
}
