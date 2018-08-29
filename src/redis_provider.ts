import * as vscode from 'vscode';
import * as fs from 'fs';
import * as Redis from 'ioredis';
import * as path from 'path';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';

export const redisClient =
  new Redis({
    port: 6379,
    host: '10.142.0.17',
    password: 'unKHYubHDaBz27L48cXiq6Zs6NCVL5',
    showFriendlyErrorStack: true,
	});
	
type KeyObjectType = {[k: string]: object | string};

export class RedisKeyProvider implements vscode.TreeDataProvider<RedisKeyItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<RedisKeyItem | undefined> = new vscode.EventEmitter<RedisKeyItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<RedisKeyItem | undefined> = this._onDidChangeTreeData.event;

	private keyObject: KeyObjectType = {};
	private keyFilter: string = '';

	constructor() {
	}

	setKeyFilter(filter: string) {
    this.keyFilter = filter;
    this.refresh();
	}

	refresh(): Thenable<void> {
		this._onDidChangeTreeData.fire();
		return this.getRedisKeyObjectByPattern().then((keyObj) => {
			this.keyObject = keyObj;
		});
	}

	getTreeItem(element: RedisKeyItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: RedisKeyItem): Thenable<RedisKeyItem[]> {
		return new Bluebird(async (fulfill, reject) => {
			if (!this.keyObject) {
				await this.refresh();
			}

			let children: RedisKeyItem[] = [];
	
			if (!element) {
				children = Object.keys(this.keyObject).map((key) => new RedisKeyItem(key, vscode.TreeItemCollapsibleState.Collapsed));
			} else {
				children = Object.keys(_.get(this.keyObject, element.label.split(':'))).map((key) => {
					// const fullKeyName = 
					// if (typeof key === 'object') {
					// 	return new RedisKeyItem(key, vscode.TreeItemCollapsibleState.Collapsed)
					// }
					return new RedisKeyItem([element.label, key].join(':'), vscode.TreeItemCollapsibleState.None)
				});
			}
			
			fulfill(children);
		});
	}

	private async getRedisKeyObjectByPattern(pattern?: string): Bluebird<KeyObjectType> {
		if (!pattern || pattern === '') {
			pattern = '*';
    }
    
    if (pattern.indexOf('*') === -1 && pattern.indexOf('?') === -1) {
      pattern += '*'
    }

		const keyObj: KeyObjectType = {};

		return new Bluebird<KeyObjectType>((fulfill, reject) => {
			const stream = redisClient.scanStream({ match: pattern, count: 10000 });
	
			stream.on('data', (keys: string[]) => {
				keys.forEach((key) => {
					const path = key.split(':');
					_.set(keyObj, path, '');
				});
			});
	
			stream.on('end', () => {
				fulfill(keyObj);
			});
	
			stream.on('error', reject);
		});
	}

}

class RedisKeyItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return;
	}

	contextValue = 'dependency';

}