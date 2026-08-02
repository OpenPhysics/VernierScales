# Model - Vernier Scales

This document describes the model (the underlying physics, math, and behavior) for the simulation, in
terms appropriate for an educator. It is the companion to
[implementation-notes.md](./implementation-notes.md), which targets developers.

## Overview

A vernier scale is a device for reading a fraction of a division. Beside an ordinary graduated
scale — the *main scale* — sits a second, sliding scale whose divisions are very slightly a
different size. Because of that difference, only one line of the sliding scale ever lines up
neatly with a line of the main scale, and *which* line it is tells you the fractional part of the
measurement. The whole family of instruments in this simulation — calipers, a micrometer, a bevel
protractor — is built on that one observation.

The idea a student should leave with is not "here is how to read this particular caliper" but
**the vernier principle**: two scales whose divisions differ by a known small amount can be read
together to a precision neither has alone.

## The vernier principle

Let one main-scale division be **MSD**, and let the vernier carry **n** divisions. In the ordinary
("direct") arrangement, those n vernier divisions are laid out to span exactly n − 1 main
divisions, so

    1 vernier division = (n − 1)/n × MSD

which is shorter than a main division by MSD/n. That difference is the **least count**: the finest
increment the instrument can resolve.

    least count = MSD / n

Now slide the vernier so its zero sits somewhere past the mark at *k* main divisions. Because each
vernier division falls short by one least count, vernier line 1 sits one least count behind the
next main line, line 2 sits two behind, and so on. The line that finally comes into alignment is
the one whose accumulated shortfall exactly cancels the gap — so **the number under the coincident
line is the number of least counts past the main mark.** The reading is

    reading = (whole main divisions) × MSD + (coincident line number) × least count

Everything else in this simulation is a variation on that sentence.

## The three kinds of vernier

All three have the same least count, MSD/n. They differ in how many main divisions the vernier
spans, and therefore in how crowded its marks are.

| Kind | n vernier divisions span | One vernier division | Where you meet it |
|---|---|---|---|
| Direct | n − 1 main divisions | one least count **short** of a main division | the usual 0.02 mm caliper: 50 divisions over 49 mm |
| Retrograde | n + 1 main divisions | one least count **longer** than a main division | some theodolite circles |
| Extended (Sauter) | 2n − 1 main divisions | one least count short of **two** main divisions | the 0.05 mm caliper (20 divisions over 39 mm); the bevel protractor (12 over 23°) |

The **retrograde** vernier is numbered backwards. Its divisions are longer than the main scale's,
so the coinciding line moves the wrong way as the vernier advances; printing the numbers in
reverse cancels that out, and the reading comes out forwards after all.

The **extended** vernier exists for a purely practical reason: judging whether two lines coincide
is hard when the lines are crowded. Spreading n divisions over nearly twice the length doubles the
gap between marks without changing the least count at all. This is why the real 0.05 mm caliper
spans 39 mm rather than 19, and why a protractor reading to 5 arcminutes spans 23° rather than 11°.

## Resolution, and the error it implies

A real caliper's jaws move continuously; the reading does not. A vernier resolves to one least
count and no finer, so any reading is the true size rounded to the nearest least count, and

    |reading − true size| ≤ ½ × least count

always. The Caliper screen's "Show true value" checkbox exposes exactly this: the true size, the
reading, and the difference between them. It is not a defect in the instrument — it *is* the
instrument's resolution, and it is the reason a measurement is quoted as 23.14 ± 0.01 mm rather
than as an exact number.

## Zero error

An instrument that does not read zero when closed reports every measurement wrong by the same
amount. If a caliper reads +0.06 mm with its jaws shut, every length it gives is 0.06 mm too
large, and the correction is to subtract:

    true measurement = scale reading − zero error

The zero error is *positive* when the vernier zero sits past the main zero with the jaws closed and
negative when it falls short. The Caliper screen lets you introduce one deliberately; the Practice
screen's third tier asks you to correct for it.

## The instruments modelled

| Instrument | Main division | n | Kind | Least count |
|---|---|---|---|---|
| Metric caliper | 1 mm | 10 | direct | 0.1 mm |
| Metric caliper | 1 mm | 20 | extended | 0.05 mm |
| Metric caliper | 1 mm | 50 | direct | 0.02 mm |
| Metric caliper | 0.5 mm | 20 | direct | 0.025 mm |
| Inch caliper (decimal) | 0.025 in | 25 | direct | 0.001 in |
| Inch caliper (decimal) | 0.025 in | 50 | direct | 0.0005 in |
| Inch caliper (fractional) | 1/16 in | 8 | direct | 1/128 in |
| Inch rule (fractional) | 1/8 in | 8 | direct | 1/64 in |
| Vernier micrometer | 0.01 mm | 10 | direct | 0.001 mm |
| Bevel protractor | 1° | 12 | extended | 5 arcminutes |

The decimal-inch main scale divides the inch into forty parts, so one division is 0.025 in and
every fourth mark is a numbered tenth. The **fractional-inch** caliper is a genuinely different
reading skill: its answers are mixed fractions in lowest terms, so 160/128 in is written 1 1/4 in
and not 1 32/128 in.

## The four ways a caliper measures

One instrument, one scale, four dimensions — all read off the same graduations.

- **Outside jaws** close on an external dimension: a diameter, a thickness.
- **Inside jaws** open inside a bore, and the dimension is between their outer faces.
- **Depth rod** extends from the tail of the beam by exactly as much as the jaws open, and drops
  into a blind hole.
- **Step faces** — the end of the beam against the end of the slider — bridge a shoulder.

## Simplifications

- The simulation ignores every source of error except resolution and zero error. Real measurement
  also contends with jaw wear, measuring force, parallax, thermal expansion, and Abbe error; none
  of those are modelled.
- Practice questions are always set to values that fall exactly on a least count, so that every
  question has an answer a student can actually type. Real instruments are under no such
  obligation — which is what the Caliper screen's true-value readout is there to show.
- The Vernier Principle screen's scale is synthetic: its main division is one millimetre and its
  division count is whatever you choose, including combinations no manufacturer makes. That is
  deliberate; the point of the screen is the relationship, not any particular tool.
