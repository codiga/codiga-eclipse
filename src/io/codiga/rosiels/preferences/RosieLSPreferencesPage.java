package io.codiga.rosiels.preferences;

import org.eclipse.core.resources.ResourcesPlugin;
import org.eclipse.jface.preference.FieldEditorPreferencePage;
import org.eclipse.jface.preference.StringFieldEditor;
import org.eclipse.lsp4e.LanguageServersRegistry;
import org.eclipse.lsp4e.LanguageServiceAccessor;
import org.eclipse.lsp4j.DidChangeConfigurationParams;
import org.eclipse.ui.IWorkbench;
import org.eclipse.ui.IWorkbenchPreferencePage;

/**
 * Via the {@code org.eclipse.ui.preferencePages} extension point, it registers a new page in the
 * Eclipse IDE Preferences.
 * <p>
 * On this page, users can specify their Codiga API Tokens.
 */
public class RosieLSPreferencesPage extends FieldEditorPreferencePage implements IWorkbenchPreferencePage {

	private StringFieldEditor codigaApiTokenField;
	
	public RosieLSPreferencesPage() {
		super(GRID);
	}

	@Override
	public void init(IWorkbench workbench) {
		setPreferenceStore(RosieLSPreferences.getInstance().getStore());
		setMessage("Rosie Language Server");
	}

	@Override
	protected void createFieldEditors() {
		codigaApiTokenField = new StringFieldEditor(RosieLSPreferences.CODIGA_API_TOKEN, "Codiga API Token:", getFieldEditorParent());
		addField(codigaApiTokenField);
	}

	@SuppressWarnings("restriction")
	@Override
	public boolean performOk() {
		boolean superOK = super.performOk();

		//If the Rosie Language Server is not available, don't send didChangeConfiguration
		var rosieLanguageServer = LanguageServersRegistry.getInstance().getDefinition("rosie.language.server");
		if (rosieLanguageServer == null) {
			return superOK;
		}

		//Find the Rosie Language Server (the language server whose definition id matches the Rosie Language Server's id).
		// If it is found, send a {@link Configuration} object with the changed preferences.
		for (var project : ResourcesPlugin.getWorkspace().getRoot().getProjects()) {
			if (project.isAccessible()) {
				try {
					LanguageServiceAccessor.getLanguageServers(project, null)
						.stream()
						.filter(server -> LanguageServiceAccessor.resolveServerDefinition(server)
							.map(serverDef -> serverDef.id.equals(rosieLanguageServer.id))
							.orElse(false))
						.findFirst()
						.ifPresent(server -> {
							RosieLSPreferences.getInstance().setCodigaApiToken(codigaApiTokenField.getStringValue());
							server.getWorkspaceService().didChangeConfiguration(new DidChangeConfigurationParams(new Configuration()));
						});
				} catch (Exception e) {
					e.printStackTrace();
				}
			}
		}

		return superOK;

	}
	
	/**
	 * Configuration object to send to the language server when the preferences (the configuration) changes. 
	 * <p>
	 * On language server side, the configuration will be called {@code codigaApiToken} due to the name of the
	 * class field. In order to get {@code codiga.api.token} on server side, it would require having nested objects here.
	 */
	public static final class Configuration {
		private final String codigaApiToken;

		public Configuration() {
			this.codigaApiToken = RosieLSPreferences.getInstance().getCodigaApiToken();
		}

		public String getCodigaApiToken() {
			return codigaApiToken;
		}
	}
}
