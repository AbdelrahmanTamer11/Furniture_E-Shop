// Test data generation methods for AIRoomAssistant
AIRoomAssistant.prototype.createTestAIResponse = function (roomType, stylePreference) {
    const suggestions = [];

    // Generate furniture suggestions based on room type and style
    const furnitureTemplates = {
        living_room: [
            { name: "Sofa", category: "Seating", basePrice: 599 },
            { name: "Coffee Table", category: "Tables", basePrice: 299 },
            { name: "Floor Lamp", category: "Lighting", basePrice: 149 },
            { name: "Bookshelf", category: "Storage", basePrice: 199 }
        ],
        bedroom: [
            { name: "Bed Frame", category: "Bedroom", basePrice: 499 },
            { name: "Nightstand", category: "Bedroom", basePrice: 129 },
            { name: "Dresser", category: "Storage", basePrice: 349 },
            { name: "Table Lamp", category: "Lighting", basePrice: 79 }
        ],
        dining_room: [
            { name: "Dining Table", category: "Tables", basePrice: 799 },
            { name: "Dining Chairs", category: "Seating", basePrice: 149 },
            { name: "Sideboard", category: "Storage", basePrice: 599 },
            { name: "Pendant Light", category: "Lighting", basePrice: 199 }
        ],
        office: [
            { name: "Desk", category: "Office", basePrice: 399 },
            { name: "Office Chair", category: "Seating", basePrice: 249 },
            { name: "Filing Cabinet", category: "Storage", basePrice: 179 },
            { name: "Desk Lamp", category: "Lighting", basePrice: 89 }
        ],
        kitchen: [
            { name: "Kitchen Island", category: "Kitchen", basePrice: 899 },
            { name: "Bar Stools", category: "Seating", basePrice: 99 },
            { name: "Storage Cabinet", category: "Storage", basePrice: 299 },
            { name: "Pendant Lights", category: "Lighting", basePrice: 129 }
        ]
    };

    const styleModifiers = {
        Modern: { colorPalette: ["White", "Black", "Gray"], material: "Metal", priceMultiplier: 1.2 },
        Scandinavian: { colorPalette: ["Light Wood", "White", "Beige"], material: "Pine Wood", priceMultiplier: 1.1 },
        Classic: { colorPalette: ["Dark Wood", "Cream", "Gold"], material: "Oak Wood", priceMultiplier: 1.3 },
        Industrial: { colorPalette: ["Black", "Metal Gray", "Brown"], material: "Steel", priceMultiplier: 1.15 },
        Minimalist: { colorPalette: ["White", "Light Gray", "Natural"], material: "Composite", priceMultiplier: 1.0 }
    };

    const roomFurniture = furnitureTemplates[roomType] || furnitureTemplates.living_room;
    const styleInfo = styleModifiers[stylePreference] || styleModifiers.Modern;

    roomFurniture.forEach((furniture, index) => {
        const color = styleInfo.colorPalette[index % styleInfo.colorPalette.length];
        const price = furniture.basePrice * styleInfo.priceMultiplier;

        suggestions.push({
            ai_suggestion: {
                name: `${stylePreference} ${furniture.name}`,
                color: color,
                material: styleInfo.material,
                price: Math.round(price),
                placement: this.generatePlacement(furniture.name, roomType),
                category: furniture.category
            },
            matching_products: [],
            estimated_price: Math.round(price)
        });
    });

    const totalCost = suggestions.reduce((sum, s) => sum + s.estimated_price, 0);

    return {
        suggestions: suggestions,
        total_cost: totalCost,
        style_analysis: `This ${roomType.replace('_', ' ')} has been analyzed for ${stylePreference} style furniture. The space appears suitable for ${suggestions.length} key furniture pieces that will complement the room's layout and lighting. The ${stylePreference} style emphasizes ${this.getStyleDescription(stylePreference)}.`
    };
};

AIRoomAssistant.prototype.generatePlacement = function (furnitureName, roomType) {
    const placements = {
        Sofa: "Against the main wall facing the entertainment area",
        "Coffee Table": "Center of the seating area",
        "Floor Lamp": "In the corner next to seating for ambient lighting",
        Bookshelf: "Along the side wall for easy access",
        "Bed Frame": "Centered against the largest wall",
        Nightstand: "Beside the bed for convenience",
        Dresser: "Opposite the bed or in the corner",
        "Table Lamp": "On the nightstand for reading light",
        "Dining Table": "Center of the dining area",
        "Dining Chairs": "Around the dining table",
        Sideboard: "Against the wall for serving and storage",
        "Pendant Light": "Above the dining table",
        Desk: "Near the window for natural light",
        "Office Chair": "At the desk for optimal ergonomics",
        "Filing Cabinet": "Beside or under the desk",
        "Desk Lamp": "On the desk for task lighting"
    };

    return placements[furnitureName] || "Positioned optimally within the room layout";
};

AIRoomAssistant.prototype.getStyleDescription = function (style) {
    const descriptions = {
        Modern: "clean lines, minimal decoration, and contemporary materials",
        Scandinavian: "natural materials, light colors, and functional design",
        Classic: "traditional elegance, rich materials, and timeless appeal",
        Industrial: "raw materials, exposed elements, and urban aesthetics",
        Minimalist: "simplicity, essential functionality, and uncluttered spaces"
    };
    return descriptions[style] || "contemporary design principles";
};
