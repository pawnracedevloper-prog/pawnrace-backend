import {User} from "../models/user.model.js";

// Hardcoded backend source of truth to prevent frontend price spoofing
const SHOP_ITEMS = {
    "obsidian_glass": { price: 500, type: "board_skin" },
    "walnut_ivory": { price: 300, type: "board_skin" },
    "emerald_marble": { price: 600, type: "board_skin" },
    "arcane_void": { price: 1200, type: "board_skin" },
    "cyber_syndicate": { price: 1500, type: "board_skin" }
};

export const purchaseItem = async (req, res, next) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id);

        const item = SHOP_ITEMS[itemId];
        if (!item) {
            return res.status(404).json({ success: false, message: "Item does not exist in the Vault." });
        }

        if (user.inventory.includes(itemId)) {
            return res.status(400).json({ success: false, message: "You already own this item." });
        }

        const currentWallet = user.stats?.shopPoints || 0; 

        if (currentWallet < item.price) {
            return res.status(403).json({ success: false, message: "Insufficient points." });
        }

        // Deduct funds and add to inventory
        user.stats.shopPoints -= item.price;
        user.inventory.push(itemId);
        await user.save();

        return res.status(200).json({ 
            success: true, 
            message: "Purchase authorized.",
            wallet: user.stats.shopPoints,
            inventory: user.inventory
        });
    } catch (error) {
        next(error);
    }
};

export const equipItem = async (req, res, next) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.inventory.includes(itemId)) {
            return res.status(403).json({ success: false, message: "Item not found in your inventory." });
        }

        user.equippedBoardSkin = itemId;
        await user.save();

        return res.status(200).json({ 
            success: true, 
            message: "Skin equipped successfully.",
            equippedBoardSkin: user.equippedBoardSkin
        });
    } catch (error) {
        next(error);
    }
};