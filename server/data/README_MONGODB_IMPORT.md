# Manual MongoDB import

Use database **`katalog`** and collections **`groups`** and **`photocards`**.

**Why two import files?**  
`mongodb_manual_import.json` is one object `{ "groups": [...], "photocards": [...] }`. **mongoimport --jsonArray** expects a file whose root is a single JSON array. So use the array-only files below for mongoimport, or copy-paste from the combined file into Compass one document at a time.

- **`groups_import.json`** – single JSON array of 4 group documents (for mongoimport or paste).
- **`photocards_import.json`** – single JSON array of 5 photocard documents (for mongoimport or paste).
- **`mongodb_manual_import.json`** – combined object; use for copy-paste in Compass (paste each element of `groups` and `photocards` separately).

---

## Option 1: MongoDB Compass (paste one by one)

1. Create database **katalog** (or select it).
2. Create collection **groups**. For each object in the `groups` array in the JSON file, use **Add Data → Insert Document** and paste that object (without the surrounding `[ ]`).
3. Create collection **photocards**. For each object in the `photocards` array, **Insert Document** and paste that object.

---

## Option 2: Copy-paste below (groups only, then photocards)

**1. Collection `groups` – paste each of these as a new document:**

```json
{"id":"newjeans","name":"NewJeans","koreanName":"뉴진스","company":"ADOR","debutYear":2022,"imageUrl":"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop","members":[{"id":"minji","name":"Minji","koreanName":"민지","imageUrl":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop","photocardCount":45,"groupId":"newjeans","groupName":"NewJeans"},{"id":"hanni","name":"Hanni","koreanName":"하니","imageUrl":"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop","photocardCount":42,"groupId":"newjeans","groupName":"NewJeans"},{"id":"danielle","name":"Danielle","koreanName":"다니엘","imageUrl":"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop","photocardCount":38,"groupId":"newjeans","groupName":"NewJeans"},{"id":"haerin","name":"Haerin","koreanName":"해린","imageUrl":"https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop","photocardCount":41,"groupId":"newjeans","groupName":"NewJeans"},{"id":"hyein","name":"Hyein","koreanName":"혜인","imageUrl":"https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=300&fit=crop","photocardCount":35,"groupId":"newjeans","groupName":"NewJeans"}]}
```

```json
{"id":"aespa","name":"Aespa","koreanName":"에스파","company":"SM Entertainment","debutYear":2020,"imageUrl":"https://www.hollywoodreporter.com/wp-content/uploads/2025/06/aespa_DirtyWork_Teaser_Image-5-e1750991147839.jpg?w=1500&h=845&crop=1","members":[{"id":"karina","name":"Karina","koreanName":"카리나","imageUrl":"https://d.kpopstarz.com/en/full/675046/aespa-karina-draws-attention-stunning-visuals-these-makeup-campaign-photos-why-my-girl-so.png?w=1600&h=1600&q=88&f=6f72834ab9797f45a77550f39be92ce0","photocardCount":52,"groupId":"aespa","groupName":"Aespa"},{"id":"giselle","name":"Giselle","koreanName":"지젤","imageUrl":"https://pbs.twimg.com/media/G4b7r1zasAAQAMN.jpg","photocardCount":48,"groupId":"aespa","groupName":"Aespa"},{"id":"winter","name":"Winter","koreanName":"윈터","imageUrl":"https://kpopping.com/documents/2a/0/800/aespa-Winter-for-Espoir-Winter-2024-documents-2.jpeg?v=50274","photocardCount":55,"groupId":"aespa","groupName":"Aespa"},{"id":"ningning","name":"Ningning","koreanName":"닝닝","imageUrl":"https://i.redd.it/250116-aespa-2025-smtown-the-culture-the-future-concept-v0-80nxc2ala6de1.jpg?width=2731&format=pjpg&auto=webp&s=bec381aa929066b0a256ef14c22c813563160759","photocardCount":47,"groupId":"aespa","groupName":"Aespa"}]}
```

```json
{"id":"ive","name":"IVE","koreanName":"아이브","company":"Starship Entertainment","debutYear":2021,"imageUrl":"https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop","members":[{"id":"yujin","name":"Yujin","koreanName":"유진","imageUrl":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop","photocardCount":38,"groupId":"ive","groupName":"IVE"},{"id":"gaeul","name":"Gaeul","koreanName":"가을","imageUrl":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop","photocardCount":32,"groupId":"ive","groupName":"IVE"},{"id":"rei","name":"Rei","koreanName":"레이","imageUrl":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop","photocardCount":35,"groupId":"ive","groupName":"IVE"},{"id":"wonyoung","name":"Wonyoung","koreanName":"원영","imageUrl":"https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=300&h=300&fit=crop","photocardCount":58,"groupId":"ive","groupName":"IVE"},{"id":"liz","name":"Liz","koreanName":"리즈","imageUrl":"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop","photocardCount":30,"groupId":"ive","groupName":"IVE"},{"id":"leeseo","name":"Leeseo","koreanName":"이서","imageUrl":"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop","photocardCount":28,"groupId":"ive","groupName":"IVE"}]}
```

```json
{"id":"lesserafim","name":"LE SSERAFIM","koreanName":"르세라핌","company":"Source Music","debutYear":2022,"imageUrl":"https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=400&h=400&fit=crop","members":[{"id":"sakura","name":"Sakura","koreanName":"사쿠라","imageUrl":"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop","photocardCount":44,"groupId":"lesserafim","groupName":"LE SSERAFIM"},{"id":"chaewon","name":"Chaewon","koreanName":"채원","imageUrl":"https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop","photocardCount":46,"groupId":"lesserafim","groupName":"LE SSERAFIM"},{"id":"yunjin","name":"Yunjin","koreanName":"윤진","imageUrl":"https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=300&fit=crop","photocardCount":40,"groupId":"lesserafim","groupName":"LE SSERAFIM"},{"id":"kazuha","name":"Kazuha","koreanName":"카즈하","imageUrl":"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=300&fit=crop","photocardCount":42,"groupId":"lesserafim","groupName":"LE SSERAFIM"},{"id":"eunchae","name":"Eunchae","koreanName":"은채","imageUrl":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop","photocardCount":36,"groupId":"lesserafim","groupName":"LE SSERAFIM"}]}
```

**2. Collection `photocards` – paste each as a new document:**

```json
{"id":"pc-001","memberId":"minji","memberName":"Minji","groupId":"newjeans","groupName":"NewJeans","album":"New Jeans","version":"Version A","year":2022,"type":"album","imageUrl":"https://picsum.photos/seed/minji-nj-a/300/400"}
```
```json
{"id":"pc-002","memberId":"minji","memberName":"Minji","groupId":"newjeans","groupName":"NewJeans","album":"New Jeans","version":"Version B","year":2022,"type":"album","imageUrl":"https://picsum.photos/seed/minji-nj-b/300/400"}
```
```json
{"id":"pc-020","memberId":"karina","memberName":"Karina","groupId":"aespa","groupName":"Aespa","album":"Armageddon","version":"My Power Ver","year":2024,"type":"album","imageUrl":"https://i.pinimg.com/736x/c0/54/f1/c054f12c7fa1ec01bcb2e03e6bd0ac48.jpg","backImageUrl":"https://media.discordapp.net/attachments/990030748201402401/1468147605044330538/s-l1200.jpg"}
```
```json
{"id":"pc-031","memberId":"wonyoung","memberName":"Wonyoung","groupId":"ive","groupName":"IVE","album":"ELEVEN","version":"Version A","year":2021,"type":"album","imageUrl":"https://picsum.photos/seed/wonyoung-eleven-a/300/400"}
```
```json
{"id":"pc-038","memberId":"chaewon","memberName":"Chaewon","groupId":"lesserafim","groupName":"LE SSERAFIM","album":"FEARLESS","version":"Version A","year":2022,"type":"album","imageUrl":"https://picsum.photos/seed/chaewon-fearless-a/300/400"}
```

---

## Option 3: mongoimport (from server/data folder)

Use the **array-only** files so `--jsonArray` works (root of file must be `[ ... ]`, not `{ "groups": ... }`):

```bash
cd server/data

# Import groups (4 documents)
mongoimport --uri="YOUR_MONGODB_URI" --db=katalog --collection=groups --file=groups_import.json --jsonArray

# Import photocards (5 documents)
mongoimport --uri="YOUR_MONGODB_URI" --db=katalog --collection=photocards --file=photocards_import.json --jsonArray
```
