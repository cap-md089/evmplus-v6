rm apis/types/mysql__xdevapi/index.d.ts
rm auto-api-tests/types/mysql__xdevapi/index.d.ts
rm auto-client-api/types/mysql__xdevapi/index.d.ts
rm server-common/types/mysql__xdevapi/index.d.ts
rm server/types/mysql__xdevapi/index.d.ts

cp lib/types/mysql__xdevapi/index.d.ts apis/types/mysql__xdevapi
cp lib/types/mysql__xdevapi/index.d.ts auto-api-tests/types/mysql__xdevapi
cp lib/types/mysql__xdevapi/index.d.ts auto-client-api/types/mysql__xdevapi
cp lib/types/mysql__xdevapi/index.d.ts server-common/types/mysql__xdevapi
cp lib/types/mysql__xdevapi/index.d.ts server/types/mysql__xdevapi
