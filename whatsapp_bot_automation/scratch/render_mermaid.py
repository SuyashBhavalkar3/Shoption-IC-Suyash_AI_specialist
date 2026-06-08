import base64
import httpx

mermaid_code = """
graph TD
    classDef entry fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef menu fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef mkt fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef sales fill:#fce4ec,stroke:#c2185b,stroke-width:2px;
    classDef after fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    
    Entry["👋 Customer Sends:<br/>'Hi', 'Hello', 'Start'"]:::entry
    Welcome["🌱 Welcome to Shoption!<br/>How can we assist you today?"]:::entry
    Entry --> Welcome
    
    MainMenu["📋 Main Menu"]:::menu
    Welcome --> MainMenu
    
    Explore["Explore Products<br/>(Internal: Marketing)"]:::mkt
    MainMenu --> Explore
    
    CatMenu["Category Groups Menu<br/>1. Cameras & Solar Traps<br/>2. Spraying Drones (Direct)<br/>3. Weeders & Earth Augers<br/>4. Sprayers & Spray Pumps<br/>5. Pumps & Cables<br/>6. Seeders & Kolape<br/>7. Tarpaulins & Pipes<br/>8. Back"]:::mkt
    Explore --> CatMenu
    
    SubWeeder["Weeder Subcategories<br/>1. Diesel Power Weeders<br/>2. Petrol Weeders & Augers<br/>3. Brush Cutters & Rotavators<br/>4. Back"]:::mkt
    SubSeeder["Seeder Subcategories<br/>1. Premium Seeders<br/>2. Seed & Fertilizer<br/>3. Manual & Cycle Seeders<br/>4. Back"]:::mkt
    SubSprayer["Sprayer Subcategories<br/>1. Single Motor Pumps<br/>2. Double Motor Pumps<br/>3. Petrol Engine Sprayers<br/>4. Back"]:::mkt
    
    SubCamera["Camera & Traps Subcategories<br/>1. Security Cameras<br/>2. Solar Insect Traps<br/>3. Back"]:::mkt
    SubWater["Pumps & Cables Subcategories<br/>1. Water Pumps<br/>2. Submersible Cables<br/>3. Back"]:::mkt
    SubUtility["Tarpaulins & Pipes Subcategories<br/>1. Tarpaulins<br/>2. Rain Pipes<br/>3. Back"]:::mkt

    CatMenu -->|Select Weeders| SubWeeder
    CatMenu -->|Select Seeders| SubSeeder
    CatMenu -->|Select Sprayers| SubSprayer
    CatMenu -->|Select Cameras| SubCamera
    CatMenu -->|Select Pumps| SubWater
    CatMenu -->|Select Tarpaulins| SubUtility
    
    DroneList["Drones List<br/>1. AgriVeer Drone<br/>2. Back"]:::mkt
    CatMenu -->|Select Drones| DroneList
    
    WeederList["Weeder Product List<br/>- 9 HP Diesel Weeder<br/>- EarthMax 63 Super Pro<br/>- Rotavator / Brush Cutter"]:::mkt
    SubWeeder -->|Select Subcategory| WeederList

    SeederList["Seeder Product List<br/>- 16 Teeth / 12 Teeth Premium<br/>- Seed + Fertilizer Seeder<br/>- Cycle Kolape"]:::mkt
    SubSeeder -->|Select Subcategory| SeederList

    SprayerList["Sprayer Product List<br/>- Single Motor Pump 16L<br/>- Double Motor Pump 20L / Tufaan<br/>- PowerMax 35 Premium"]:::mkt
    SubSprayer -->|Select Subcategory| SprayerList

    CameraList["Camera / Trap List<br/>- 4G Solar Camera<br/>- GBRU Solar Trap"]:::mkt
    SubCamera -->|Select Subcategory| CameraList

    WaterList["Water Pumps & Cables List<br/>- AquaForce 80CC Pump<br/>- Flat Submersible Cable"]:::mkt
    SubWater -->|Select Subcategory| WaterList

    UtilityList["Tarpaulins & Rain Pipes List<br/>- 30x30 / 50x50 / 24x50 Tarpaulin<br/>- Rain Pipe 20 / 32 / 40 MM"]:::mkt
    SubUtility -->|Select Subcategory| UtilityList
    
    ProdDetails["Product Details Card<br/>- Static Specs & Details<br/>- Price & MRP<br/>- COD vs Pre-payment Options"]:::sales
    
    DroneList -->|Select Product| ProdDetails
    WeederList -->|Select Product| ProdDetails
    SeederList -->|Select Product| ProdDetails
    SprayerList -->|Select Product| ProdDetails
    CameraList -->|Select Product| ProdDetails
    WaterList -->|Select Product| ProdDetails
    UtilityList -->|Select Product| ProdDetails
    
    ProdActions["Product Actions<br/>1. Buy Now (Sales)<br/>2. Back to List (Sales)<br/>3. Main Menu"]:::sales
    ProdDetails --> ProdActions
    
    TrackOrder["Track My Order<br/>(Internal: After Sales)"]:::after
    MainMenu --> TrackOrder
    
    SearchOrder["Enter Order ID..."]:::after
    TrackOrder --> SearchOrder
    
    OrderDetails["Order Status Details<br/>- Packaging/Dispatched Status<br/>- Shoption Logistics tracking"]:::after
    SearchOrder -->|Enter ID| OrderDetails
    
    OrderActions["Order Actions<br/>1. Back to Main Menu"]:::after
    OrderDetails --> OrderActions
    
    RaiseQuery["Raise a Query<br/>(Internal: After Sales)"]:::after
    MainMenu --> RaiseQuery
    
    DescribeIssue["Type Support Query Details"]:::after
    RaiseQuery --> DescribeIssue
    
    TicketSuccess["Query Registered Successfully<br/>- Logged in customer system"]:::after
    DescribeIssue -->|Submit Text| TicketSuccess
    
    TicketActions["Ticket Actions<br/>1. Ask Another Query<br/>2. Return to Main Menu"]:::after
    TicketSuccess --> TicketActions
    
    CustomerCare["Talk to Customer Care<br/>(Internal: After Sales)"]:::after
    MainMenu --> CustomerCare
    
    ArrangeCallback["Callback Info<br/>- Missed call callback details (9890450985)<br/>- 24 hour SLA window"]:::after
    CustomerCare --> ArrangeCallback
    
    ArrangeCallback -->|Main Menu| MainMenu
    TicketActions -->|Main Menu| MainMenu
    OrderActions -->|Main Menu| MainMenu
    ProdActions -->|Main Menu| MainMenu
"""


def generate_png():
    # Convert Mermaid code to base64
    code_bytes = mermaid_code.strip().encode('utf-8')
    base64_bytes = base64.b64encode(code_bytes)
    base64_string = base64_bytes.decode('utf-8')
    
    url = f"https://mermaid.ink/img/{base64_string}"
    
    print("Fetching rendered Mermaid image from API...")
    r = httpx.get(url, timeout=30.0)
    r.raise_for_status()
    
    out_path = "/Users/suyash3/.gemini/antigravity-ide/brain/cec72762-424c-475d-938d-7087af0748b3/whatsapp_bot_tree_diagram_detailed.png"
    with open(out_path, "wb") as f:
        f.write(r.content)
    print(f"Saved detailed PNG to {out_path}")

if __name__ == "__main__":
    generate_png()
