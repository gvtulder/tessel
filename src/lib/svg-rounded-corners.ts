/*****************************************************************************
 *                                                                            *
 *  SVG Path Rounding Function                                                *
 *  Copyright (C) 2014 Yona Appletree                                         *
 *                                                                            *
 *  Licensed under the Apache License, Version 2.0 (the "License");           *
 *  you may not use this file except in compliance with the License.          *
 *  You may obtain a copy of the License at                                   *
 *                                                                            *
 *      http://www.apache.org/licenses/LICENSE-2.0                            *
 *                                                                            *
 *  Unless required by applicable law or agreed to in writing, software       *
 *  distributed under the License is distributed on an "AS IS" BASIS,         *
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 *  See the License for the specific language governing permissions and       *
 *  limitations under the License.                                            *
 *                                                                            *
 *****************************************************************************/

type Point = {
    x: number;
    y: number;
};

type Command = (string | number)[] & {
    origPoint?: Point;
};

/**
 * SVG Path rounding function. Takes an input path string and outputs a path
 * string where all line-line corners have been rounded. Only supports absolute
 * commands at the moment.
 *
 * @param pathString The SVG input path
 * @param radius The amount to round the corners, either a value in the SVG
 *               coordinate space, or, if useFractionalRadius is true, a value
 *               from 0 to 1.
 * @param useFractionalRadius If true, the curve radius is expressed as a
 *               fraction of the distance between the point being curved and
 *               the previous and next points.
 * @returns A new SVG path string with the rounding
 */
export function roundPathCorners(
    pathString: string,
    radius: number,
    useFractionalRadius: boolean,
): string {
    function moveTowardsLength(
        movingPoint: Point,
        targetPoint: Point,
        amount: number,
    ): Point {
        const width = targetPoint.x - movingPoint.x;
        const height = targetPoint.y - movingPoint.y;

        const distance = Math.sqrt(width * width + height * height);

        return moveTowardsFractional(
            movingPoint,
            targetPoint,
            Math.min(1, amount / distance),
        );
    }
    function moveTowardsFractional(
        movingPoint: Point,
        targetPoint: Point,
        fraction: number,
    ): Point {
        return {
            x: movingPoint.x + (targetPoint.x - movingPoint.x) * fraction,
            y: movingPoint.y + (targetPoint.y - movingPoint.y) * fraction,
        };
    }

    // Adjusts the ending position of a command
    function adjustCommand(cmd: Command, newPoint: Point): void {
        if (cmd.length > 2) {
            cmd[cmd.length - 2] = newPoint.x;
            cmd[cmd.length - 1] = newPoint.y;
        }
    }

    // Gives an {x, y} object for a command's ending position
    function pointForCommand(cmd: Command): Point {
        return {
            x: parseFloat(cmd[cmd.length - 2] as string),
            y: parseFloat(cmd[cmd.length - 1] as string),
        };
    }

    // Split apart the path, handing concatenated letters and numbers
    const pathParts = pathString
        .split(/[,\s]/)
        .reduce((parts: string[], part: string): string[] => {
            const match = part.match("([a-zA-Z])(.+)");
            if (match) {
                parts.push(match[1]);
                parts.push(match[2]);
            } else {
                parts.push(part);
            }

            return parts;
        }, []);

    // Group the commands with their arguments for easier handling
    const commands = pathParts.reduce(
        (commands: Command[], part: string): Command[] => {
            if (
                parseFloat(part) == (part as unknown as number) &&
                commands.length
            ) {
                commands[commands.length - 1].push(part);
            } else {
                commands.push([part]);
            }

            return commands;
        },
        [],
    );

    // The resulting commands, also grouped
    let resultCommands: Command[] = [];

    if (commands.length > 1) {
        const startPoint = pointForCommand(commands[0]);

        // Handle the close path case with a "virtual" closing line
        let virtualCloseLine: Command = null!;
        if (commands[commands.length - 1][0] == "Z" && commands[0].length > 2) {
            virtualCloseLine = ["L", startPoint.x, startPoint.y];
            commands[commands.length - 1] = virtualCloseLine;
        }

        // We always use the first command (but it may be mutated)
        resultCommands.push(commands[0]);

        for (let cmdIndex = 1; cmdIndex < commands.length; cmdIndex++) {
            const prevCmd = resultCommands[resultCommands.length - 1];

            const curCmd = commands[cmdIndex];

            // Handle closing case
            const nextCmd =
                curCmd == virtualCloseLine
                    ? commands[1]
                    : commands[cmdIndex + 1];

            // Nasty logic to decide if this path is a candidate.
            if (
                nextCmd &&
                prevCmd &&
                prevCmd.length > 2 &&
                curCmd[0] == "L" &&
                nextCmd.length > 2 &&
                nextCmd[0] == "L"
            ) {
                // Calc the points we're dealing with
                const prevPoint = pointForCommand(prevCmd);
                const curPoint = pointForCommand(curCmd);
                const nextPoint = pointForCommand(nextCmd);

                // The start and end of the cuve are just our point moved towards the previous and next points, respectively
                let curveStart: Point, curveEnd: Point;

                if (useFractionalRadius) {
                    curveStart = moveTowardsFractional(
                        curPoint,
                        prevCmd.origPoint || prevPoint,
                        radius,
                    );
                    curveEnd = moveTowardsFractional(
                        curPoint,
                        nextCmd.origPoint || nextPoint,
                        radius,
                    );
                } else {
                    curveStart = moveTowardsLength(curPoint, prevPoint, radius);
                    curveEnd = moveTowardsLength(curPoint, nextPoint, radius);
                }

                // Adjust the current command and add it
                adjustCommand(curCmd, curveStart);
                curCmd.origPoint = curPoint;
                resultCommands.push(curCmd);

                // The curve control points are halfway between the start/end of the curve and
                // the original point
                const startControl = moveTowardsFractional(
                    curveStart,
                    curPoint,
                    0.5,
                );
                const endControl = moveTowardsFractional(
                    curPoint,
                    curveEnd,
                    0.5,
                );

                // Create the curve
                const curveCmd: Command = [
                    "C",
                    startControl.x,
                    startControl.y,
                    endControl.x,
                    endControl.y,
                    curveEnd.x,
                    curveEnd.y,
                ];
                // Save the original point for fractional calculations
                curveCmd.origPoint = curPoint;
                resultCommands.push(curveCmd);
            } else {
                // Pass through commands that don't qualify
                resultCommands.push(curCmd);
            }
        }

        // Fix up the starting point and restore the close path if the path was orignally closed
        if (virtualCloseLine) {
            const newStartPoint = pointForCommand(
                resultCommands[resultCommands.length - 1],
            );
            resultCommands.push(["Z"]);
            adjustCommand(resultCommands[0], newStartPoint);
        }
    } else {
        resultCommands = commands;
    }

    return resultCommands.reduce(function (str, c) {
        return (
            str +
            c
                .map((x) =>
                    (x as number).toFixed ? (x as number).toFixed(4) : x,
                )
                .join(" ") +
            " "
        );
    }, "");
}
