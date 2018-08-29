import * as vscode from 'vscode';

import { RedisKeyProvider } from './redis_provider';

export function activate(context: vscode.ExtensionContext) {

	const redisKeyProvider = new RedisKeyProvider();

	vscode.window.registerTreeDataProvider('redisKeyView', redisKeyProvider);
	vscode.commands.registerCommand('redisKeyView.refresh', () => redisKeyProvider.refresh());
	vscode.commands.registerCommand('redisKeyView.setKeyFilter', (filter) => redisKeyProvider.setKeyFilter(filter));
}
