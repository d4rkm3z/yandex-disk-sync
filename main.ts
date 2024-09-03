import {
	App,
	ButtonComponent,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TextComponent,
} from 'obsidian';
import { Api, Resources } from 'src/api';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	authToken: string;
	storageFolder: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	authToken: '',
	storageFolder: '/obsidian'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	api: Api;

	resourcesApi: Resources;

	async init() {
		await this.loadSettings();

		this.api = new Api(this.settings.authToken);

		this.resourcesApi = new Resources(this.api);
	}

	async onload() {
		await this.init();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async setUp() {
		try {
			new Notice('Попытка создания ресурса');
			await this.resourcesApi.createDirectory(this.settings.storageFolder);
		} catch (err) {
			console.log(err)
		}
	}

	async verifyConnection() {
		try {
			const dirInfo = await this.resourcesApi.getResourceInfo(this.settings.storageFolder)
			console.log('Done => ', dirInfo)
		} catch (err) {
			console.log(err)
			const notice = new Notice(err.message);
			notice.noticeEl.setCssStyles({
				color: 'red'
			})

			if (err.code === 404) {
				new SampleModal(this.app)
					.setHandlers('setUp', this.setUp.bind(this))
					.setContent(`Произошла ошибка проверки конфигурации.
					Вероятно отсутствует указанная директория. 
					Хотите попробовать создать?`).open();
			}
		}
	}

}

type HandlersModal = {
	setUp: () => void
}

class SampleModal extends Modal {
	private handlers: HandlersModal;

	constructor(app: App) {
		super(app);
	}

	setHandlers<K extends keyof HandlersModal>(type: K, handler: HandlersModal[K]) {
		this.handlers[type] = handler;

		return this;
	}

	onOpen() {
		const { contentEl } = this;

		new ButtonComponent(contentEl)
			.setButtonText('Create')
			.onClick(async (event) => {
				this.handlers.setUp();
				this.close()
			})

	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setDesc('Auth token')
			.addText((text: TextComponent) => text
				.setPlaceholder('Yandex cloud secret for auth application')
				.setValue(this.plugin.settings.authToken)
				.onChange(async (value) => {
					this.plugin.settings.authToken = value;
					await this.plugin.saveSettings();
				})
				.inputEl.setCssStyles({
					width: '100%',
				})
			)

		new Setting(containerEl)
			.setDesc('Storage folder')
			.addText(text => text
				.setPlaceholder('Storage location on disk')
				.setValue(this.plugin.settings.storageFolder)
				.onChange(async (value) => {
					this.plugin.settings.storageFolder = value;
					await this.plugin.saveSettings();
				})
				.inputEl.setCssStyles({
					width: '100%'
				})
			)


		const div = containerEl.createDiv()
		const btnRoot = containerEl.createSpan();

		div.appendChild(containerEl.createSpan({
			text: 'Проверка подключения и существования директории, при отсутствии директории - создаст указанную папку на яндекс диске'
		}))


		new ButtonComponent(btnRoot)
			.setIcon('key-round')
			.setButtonText('Verify connection')
			.onClick(async (event) => {
				await this.plugin.verifyConnection();
			})

		// .setValue('Проверка подключения и существования директории, при отсутствии директории - создаст указанную папку на яндекс диске')
		containerEl.appendChild(div);
		containerEl.appendChild(btnRoot);


	}
}
