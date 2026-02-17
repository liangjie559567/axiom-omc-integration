/**
 * help 命令 - 显示帮助信息
 */

export default {
  name: 'help',
  description: '显示帮助信息',
  aliases: ['h', '?'],
  group: 'core',
  options: {
    usage: 'help [command]',
    examples: [
      'help',
      'help workflow:start',
      'help list'
    ]
  },

  async execute(parsed, context) {
    const { commandSystem } = context;

    if (!commandSystem) {
      return '错误：命令系统不可用';
    }

    // 如果指定了命令名称，显示该命令的详细帮助
    if (parsed.args.length > 0) {
      const commandName = parsed.args[0];
      const help = commandSystem.getCommandHelp(commandName);

      if (!help) {
        return `未找到命令: ${commandName}`;
      }

      let output = [];
      output.push('');
      output.push(`命令: ${help.name}`);
      output.push(`描述: ${help.description}`);

      if (help.aliases.length > 0) {
        output.push(`别名: ${help.aliases.join(', ')}`);
      }

      output.push(`分组: ${help.group}`);
      output.push(`用法: ${help.usage}`);

      if (help.examples.length > 0) {
        output.push('');
        output.push('示例:');
        for (const example of help.examples) {
          output.push(`  ${example}`);
        }
      }

      output.push('');

      return output.join('\n');
    }

    // 显示所有命令的概览
    const groups = commandSystem.getGroups();
    let output = [];

    output.push('');
    output.push('='.repeat(60));
    output.push('Axiom-OMC Integration - 命令帮助');
    output.push('='.repeat(60));
    output.push('');

    for (const group of groups.sort()) {
      const commands = commandSystem.getCommandsByGroup(group)
        .filter(cmd => !cmd.hidden)
        .sort((a, b) => a.name.localeCompare(b.name));

      if (commands.length === 0) {
        continue;
      }

      output.push(`【${group}】`);
      output.push('');

      for (const cmd of commands) {
        const aliases = cmd.aliases.length > 0
          ? ` (${cmd.aliases.join(', ')})`
          : '';
        output.push(`  ${cmd.name}${aliases}`);
        output.push(`    ${cmd.description}`);
        output.push('');
      }
    }

    output.push('使用 "help <command>" 查看命令的详细帮助');
    output.push('');

    return output.join('\n');
  }
};
