package io.codiga.rosiels.preferences;

import org.eclipse.core.runtime.preferences.InstanceScope;
import org.eclipse.equinox.security.storage.ISecurePreferences;
import org.eclipse.equinox.security.storage.SecurePreferencesFactory;
import org.eclipse.equinox.security.storage.StorageException;
import org.eclipse.ui.preferences.ScopedPreferenceStore;

/**
 * Communicates with Eclipse's Secure Storage to store and retrieve preference values.
 * 
 * It requires {@code Eclipse IDE > Preferences > General > Security > Secure Storage} to be available.
 */
public final class RosieLSPreferencesStore extends ScopedPreferenceStore {
	private static final String STORE_ID = "io.codiga.rosiels.eclipse.plugin";
	private final ISecurePreferences node;

	public RosieLSPreferencesStore() {
		super(InstanceScope.INSTANCE, STORE_ID);
		var secureStorage = SecurePreferencesFactory.getDefault();
		if (secureStorage == null) {
			throw new RuntimeException("Secure Storage is not available.");
		}
		node = secureStorage.node(STORE_ID);
	}

	public String getCodigaApiToken() {
		try {
			return node.get("codiga.api.token", "");
		} catch (StorageException e) {
			throw new RuntimeException(e);
		}
	}

	public void setCodigaApiToken(String apiToken) {
		try {
			node.put("codiga.api.token", apiToken, true);
		} catch (StorageException e) {
			throw new RuntimeException(e);
		}
	}
}
