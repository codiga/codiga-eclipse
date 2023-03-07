package io.codiga.rosiels.connection;

import java.io.File;
import java.io.IOException;
import java.util.List;

import org.eclipse.core.runtime.FileLocator;
import org.eclipse.lsp4e.server.ProcessStreamConnectionProvider;

/**
 * Assembles the command line command to launch the Rosie Language Server.
 * <p>
 * The server implementation is at
 * {@code <project root>/language-server/out/server.js}.
 * <p>
 * Currently, this implementation requires an environment variable called
 * {@code NODE_PATH} to be defined in order to get the location of the NodeJS
 * executable.
 */
public class RosieStreamConnectionProvider extends ProcessStreamConnectionProvider {

	public RosieStreamConnectionProvider() {
		String nodeJsLocation = System.getenv("NODE_PATH");
		
		if (nodeJsLocation != null) {
			try {
				var serverJsUrl = getClass().getResource("/language-server/out/server.js");
				String serverJsPath = FileLocator.toFileURL(serverJsUrl).getPath();
				String serverjsAbsolutePath = new File(serverJsPath).getAbsolutePath();

				//E.g. C:\Program Files\nodejs\node C:\...\language-server\out\server.js --stdio
				var commands = List.of(nodeJsLocation + "node", serverjsAbsolutePath, "--stdio");

				setCommands(commands);
				setWorkingDirectory(System.getProperty("user.dir"));
			} catch (IOException e) {
				e.printStackTrace();
			}
		} else {
			System.out.println(
					"There is no environment variable defined with name NODE_PATH (containing the Node executable path)."
							+ "It is required to launch the Rosie Language Server.");
		}
	}
}
