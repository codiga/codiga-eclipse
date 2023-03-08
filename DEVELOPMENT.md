# Development Guide

This document provides insights into how the plugin works.

## Plugin structure

```
codiga-eclipse-lsp
    - src
    - language esrver
        - node_modules                          <-- The dependencies required for the server to operate.
        - out                                   <-- The compiled sources of the server.
        - install-language-server.sh            <-- A shell script to update the server sources in the repository.
    - plugin.xml                                <-- Contains the extension points and features registered for this plugin.
    - META-INF
        - MANIFEST.MF                           <-- Contains plugin bundle information, dependencies, etc.
```

## Language server launch

Eclipse launches the language server when a file with a Rosie-supported type is opened.

## Use the latest version of the language server

If there is a change in the Rosie Language Server, its compiled sources must be updated in this plugin as well. To clone the server repository,
install dependencies, and compile sources, you can simply execute `install-language-server.sh` in the `language-server` folder.

## How to run the plugin?

There is a **Run As** option called *Eclipse Application* that you can select via the context menu of the project root folder, and under Run As.

## Articles

Here are some resources that might be useful for later:
- [Using Language Servers to Edit Code in the Eclipse IDE](https://www.eclipse.org/community/eclipse_newsletter/2017/may/article3.php)
- [Developing an Eclipse language server integration - Tutorial](https://www.vogella.com/tutorials/EclipseLanguageServer/article.html) 
- [Eclipse Platform Plugin Extension Points Reference](https://help.eclipse.org/latest/index.jsp?topic=%2Forg.eclipse.platform.doc.isv%2Freference%2Fextension-points%2Findex.html&cp%3D2_1_1)
- [GitHub: eclipse/lsp4e](https://github.com/eclipse/lsp4e)
