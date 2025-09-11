import CFonts from "cfonts";
import chalk from "chalk";

/**
 * Affiche un header ASCII + une barre d'état style "listening at …"
 * @param appName  Texte principal (ex: "BRONZIES")
 * @param status   Ligne d'état (ex: "Bronzies-RESTful-API listening at http://0.0.0.0:5555")
 */
export default function printBanner(appName: string, status: string) {
  CFonts.say(appName.toUpperCase(), {
    font: "simple",
    env: "node",
  });

  const padL = " ";
  const padR = " ";
  const line = padL + status + padR;

  const top = chalk.bgBlue(" ".repeat(line.length));
  const middle = chalk.bgBlue.white.bold(line);
  const bottom = chalk.bgBlue(" ".repeat(line.length));

  console.log(top);
  console.log(middle);
  console.log(bottom);
}
