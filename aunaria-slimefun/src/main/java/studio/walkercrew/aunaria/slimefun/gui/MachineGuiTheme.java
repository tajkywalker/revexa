package studio.walkercrew.aunaria.slimefun.gui;

/**
 * Definuje vizuální témata pro machine GUI.
 * Každé téma odkazuje na jiný .ui soubor a má specifické
 * nastavení barev a ikonek.
 */
public enum MachineGuiTheme {

    /** Výchozí fialové téma pro základní a mechanické stroje */
    BASE("SF/sf_machine_base.ui", "UI/sf_machine_base"),

    /** Elektrické téma — modro/žluté s energy barem */
    ELECTRIC("SF/sf_electric_machine.ui", "UI/sf_electric_machine"),

    /** Magické téma — tmavé fialovo-zlaté s arcane kruh animací */
    MAGICAL("SF/sf_magic_machine.ui", "UI/sf_magic_machine");

    private final String uiAssetPath;
    private final String uiPageId;

    MachineGuiTheme(String uiAssetPath, String uiPageId) {
        this.uiAssetPath = uiAssetPath;
        this.uiPageId = uiPageId;
    }

    public String getUiAssetPath() { return uiAssetPath; }
    public String getUiPageId() { return uiPageId; }
}
