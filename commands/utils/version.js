/**
 * version 命令 - 显示版本信息
 */

export default {
  name: 'version',
  description: '显示版本信息',
  aliases: ['v', 'ver'],
  group: 'utils',
  options: {
    usage: 'version',
    examples: [
      'version'
    ]
  },

  async execute(parsed, context) {
    let output = [];
    output.push('');
    output.push('Axiom-OMC Integration');
    output.push('版本: 2.1.0');
    output.push('');
    output.push('集成内容:');
    output.push('  ✅ 技能系统 (14/14)');
    output.push('  ✅ 钩子系统 (HookSystem)');
    output.push('  ✅ 命令系统 (CommandSystem)');
    output.push('');
    output.push('基于 Superpowers 架构');
    output.push('');

    return output.join('\n');
  }
};
