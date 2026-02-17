/**
 * list 命令 - 列出所有命令
 */

export default {
  name: 'list',
  description: '列出所有可用命令',
  aliases: ['ls', 'commands'],
  group: 'core',
  options: {
    usage: 'list [--group=<group>] [--search=<query>]',
    examples: [
      'list',
      'list --group=workflow',
      'list --search=start'
    ]
  },

  async execute(parsed, context) {
    const { commandSystem } = context;

    if (!commandSystem) {
      return '错误：命令系统不可用';
    }

    let commands;

    // 按分组过滤
    if (parsed.flags.group) {
      commands = commandSystem.getCommandsByGroup(parsed.flags.group);
    }
    // 搜索
    else if (parsed.flags.search) {
      commands = commandSystem.searchCommands(parsed.flags.search);
    }
    // 所有命令
    else {
      commands = commandSystem.getAllCommands();
    }

    if (commands.length === 0) {
      return '没有找到命令';
    }

    // 按名称排序
    commands.sort((a, b) => a.name.localeCompare(b.name));

    let output = [];
    output.push('');
    output.push('可用命令:');
    output.push('');

    // 按分组显示
    const groups = {};
    for (const cmd of commands) {
      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group].push(cmd);
    }

    for (const [group, cmds] of Object.entries(groups).sort()) {
      output.push(`【${group}】`);

      for (const cmd of cmds) {
        const aliases = cmd.aliases.length > 0
          ? ` (${cmd.aliases.join(', ')})`
          : '';
        output.push(`  ${cmd.name}${aliases} - ${cmd.description}`);
      }

      output.push('');
    }

    output.push(`总计: ${commands.length} 个命令`);
    output.push('');

    return output.join('\n');
  }
};
