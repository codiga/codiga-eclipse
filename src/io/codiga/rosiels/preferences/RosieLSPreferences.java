package io.codiga.rosiels.preferences;

import org.eclipse.jface.preference.IPreferenceStore;

/**
 * Provides a facade to retrieve preference values from an underlying {@link IPreferenceStore}.
 */
public final class RosieLSPreferences {
	public static final String CODIGA_API_TOKEN = "codiga.api.token";
	static RosieLSPreferences INSTANCE;

	private final RosieLSPreferencesStore store;

	public RosieLSPreferences(RosieLSPreferencesStore store) {
		this.store = store;
	}

	public String getCodigaApiToken() {
		return store.getCodigaApiToken();
	}

	public void setCodigaApiToken(String apiToken) {
		store.setCodigaApiToken(apiToken);
	}

	public IPreferenceStore getStore() {
		return store;
	}

	public static synchronized RosieLSPreferences getInstance() {
		if (INSTANCE == null) {
			INSTANCE = new RosieLSPreferences(new RosieLSPreferencesStore());
		}
		return INSTANCE;
	}
}
