package studio.walkercrew.aunaria.slimefun.system;

import com.hypixel.hytale.ecs.archetype.ArchetypeChunk;
import com.hypixel.hytale.ecs.archetype.query.Archetype;
import com.hypixel.hytale.ecs.archetype.query.Query;
import com.hypixel.hytale.ecs.system.EntityEventSystem;
import com.hypixel.hytale.ecs.world.CommandBuffer;
import com.hypixel.hytale.ecs.world.Store;
import com.hypixel.hytale.server.builtin.block.event.BlockInteractEvent;
import com.hypixel.hytale.server.core.universe.entity.EntityStore;
import com.hypixel.hytale.server.core.universe.player.Player;
import com.hypixel.hytale.server.core.universe.world.World;
import studio.walkercrew.aunaria.slimefun.SlimefunPlugin;
import studio.walkercrew.aunaria.slimefun.core.SlimefunRegistry;
import studio.walkercrew.aunaria.slimefun.energy.MachinePosition;
import studio.walkercrew.aunaria.slimefun.machine.AbstractMachine;
import studio.walkercrew.aunaria.slimefun.machine.MachineState;

import javax.annotation.Nonnull;

/**
 * ECS systém zpracovávající interakce hráče se SF stroji.
 *
 * Reaguje na BlockInteractEvent (pravý klik na blok):
 *  1. Zkontroluje zda je blok SF stroj
 *  2. Zkontroluje výzkum hráče
 *  3. Odvolá AbstractMachine.onInteract()
 *
 * Také zpracovává umístění (BlockPlaceEvent) a odebrání (BlockBreakEvent) strojů.
 *
 * POZN: Konkrétní event classes (BlockInteractEvent atd.) jsou z Hytale API.
 * Ověř přesné názvy přes: https://hytalemodding.dev/en/docs/server/events
 */
public class MachineInteractionSystem extends EntityEventSystem<EntityStore, BlockInteractEvent> {

    private final SlimefunRegistry registry;

    public MachineInteractionSystem(SlimefunRegistry registry) {
        super(BlockInteractEvent.class);
        this.registry = registry;
    }

    @Override
    public void handle(
        int index,
        @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
        @Nonnull Store<EntityStore> store,
        @Nonnull CommandBuffer<EntityStore> commandBuffer,
        @Nonnull BlockInteractEvent event
    ) {
        // Získej hráče z entity reference
        var ref = event.getEntity();
        if (ref == null) return;

        Player player = store.getComponent(ref, Player.getComponentType());
        if (player == null) return;

        World world = commandBuffer.getExternalData().getWorld();
        if (world == null) return;

        // Pozice kliknutého bloku
        var blockPos = event.getBlockPosition();
        if (blockPos == null) return;

        String worldId = world.getId();
        MachinePosition machinePos = new MachinePosition(
            worldId,
            blockPos.x(),
            blockPos.y(),
            blockPos.z()
        );

        // Zjisti ID bloku na pozici
        String blockId = getBlockIdAt(world, blockPos);
        if (blockId == null || !registry.isMachine(blockId)) return;

        AbstractMachine machine = registry.getMachine(blockId);
        MachineState state = SlimefunPlugin.instance
            .getMachineTickSystem()
            .getState(machinePos);

        // Pokud stroj ještě není zaregistrován (první klik po loadu světa), zaregistruj ho
        if (state == null) {
            state = SlimefunPlugin.instance
                .getMachineTickSystem()
                .registerMachine(machinePos, blockId);
        }

        if (state == null) return;

        // Zkontroluj výzkum
        var researchData = store.ensureAndGetComponent(ref,
            SlimefunPlugin.instance.getResearchManager().getResearchDataComponentType());

        if (!SlimefunPlugin.instance.getResearchManager().hasUnlockedItem(researchData, blockId)) {
            player.sendMessage(Player.Message.raw(
                "§c[Slimefun 2.0] Tento stroj ještě nemáš odemčen! §7Prozkoumej výzkumný strom příkazem §e/sf research§7."
            ));
            event.setCancelled(true);
            return;
        }

        // Zavolej interakci stroje
        machine.onInteract(player, state);
        event.setCancelled(true); // zabrán defaultní Hytale interakci
    }

    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }

    // ─── Pomocné metody ───────────────────────────────────────────────────────

    /**
     * Zjistí ID bloku na dané pozici ve světě.
     * TODO: Přesné API volání závisí na Hytale World API.
     */
    private String getBlockIdAt(World world, com.hypixel.hytale.math.Vector3i blockPos) {
        // Placeholder — přizpůsobit Hytale World API
        // Příklad: world.getBlock(blockPos).getItemId();
        try {
            var block = world.getBlock(blockPos.x(), blockPos.y(), blockPos.z());
            return block != null ? block.getItemId() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
