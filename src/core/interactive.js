/**
 * 交互式工具
 */

import readline from 'readline';
import chalk from 'chalk';

export class Interactive {
  /**
   * 询问用户确认
   */
  static async confirm(message, defaultValue = false) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const prompt = `${chalk.yellow('?')} ${message} ${chalk.gray(`(${defaultText})`)} `;

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close();

        const normalized = answer.trim().toLowerCase();
        if (normalized === '') {
          resolve(defaultValue);
        } else {
          resolve(normalized === 'y' || normalized === 'yes');
        }
      });
    });
  }

  /**
   * 选择选项
   */
  static async select(message, choices) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.cyan(message));
    choices.forEach((choice, index) => {
      console.log(`  ${chalk.yellow(index + 1)}.`, choice);
    });

    return new Promise((resolve) => {
      rl.question(chalk.gray('请选择 (1-' + choices.length + '): '), (answer) => {
        rl.close();

        const index = parseInt(answer) - 1;
        if (index >= 0 && index < choices.length) {
          resolve(choices[index]);
        } else {
          resolve(null);
        }
      });
    });
  }
}
