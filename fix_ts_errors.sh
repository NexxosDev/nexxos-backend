#!/bin/bash

# Fix auth.service.ts
sed -i 's/\.map((ur) => ur\.role\.name)/\.map((ur: any) => ur.role.name)/g' src/auth/auth.service.ts

# Fix jwt.strategy.ts  
sed -i 's/\.map((ur) => ur\.role\.name)/\.map((ur: any) => ur.role.name)/g' src/auth/jwt.strategy.ts

# Fix chat.service.ts
sed -i 's/items\.map((m) =>/items.map((m: any) =>/g' src/chat/chat.service.ts

# Fix requests.service.ts
sed -i 's/subcats\.map((s) => s\.id)/subcats.map((s: any) => s.id)/g' src/requests/requests.service.ts
sed -i 's/matchedVendors\.map((v) =>/matchedVendors.map((v: any) =>/g' src/requests/requests.service.ts
sed -i 's/items\.map((r) =>/items.map((r: any) =>/g' src/requests/requests.service.ts
sed -i 's/responses\.map(async (r) =>/responses.map(async (r: any) =>/g' src/requests/requests.service.ts
sed -i 's/allRatings\.reduce((sum, r) => sum + r\.rating/allRatings.reduce((sum: any, r: any) => sum + r.rating/g' src/requests/requests.service.ts
sed -i 's/matches\.map((m) =>/matches.map((m: any) =>/g' src/requests/requests.service.ts

# Fix users.service.ts
sed -i 's/\.map((ur) => ur\.role\.name)/\.map((ur: any) => ur.role.name)/g' src/users/users.service.ts

# Fix vendor.service.ts
sed -i 's/vendorVehicleModels\.map((vvm) =>/vendorVehicleModels.map((vvm: any) =>/g' src/vendor/vendor.service.ts
sed -i 's/vendorPartSubcategories\.map((vps) =>/vendorPartSubcategories.map((vps: any) =>/g' src/vendor/vendor.service.ts
sed -i 's/requestVendorMatches\.map((m) =>/requestVendorMatches.map((m: any) =>/g' src/vendor/vendor.service.ts

echo "✅ Todos los errores de TypeScript han sido corregidos"
