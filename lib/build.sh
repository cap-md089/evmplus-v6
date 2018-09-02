#!/bin/bash

mkdir -p schemas

echo "Building MemberObject..."
typescript-json-schema --refs --required index.d.ts global.MemberObject -o schemas/MemberObject.json
echo "Building FileObject..."
typescript-json-schema --refs --required index.d.ts global.FileObject -o schemas/FileObject.json
echo "Building BlogPost..."
typescript-json-schema --refs --required index.d.ts global.BlogPostObject -o schemas/BlogPost.json
echo "Building EventObject..."
typescript-json-schema --refs --required index.d.ts global.EventObject -o schemas/EventObject.json
echo "Building AccountObject..."
typescript-json-schema --refs --required index.d.ts global.AccountObject -o schemas/AccountObject.json
echo "Building NewBlogPost..."
typescript-json-schema --refs --required index.d.ts global.NewBlogPost -o schemas/NewBlogPost.json
echo "Building NewEvent..."
typescript-json-schema --refs --required index.d.ts global.NewEventObject -o schemas/NewEventObject.json

cp -r schemas ./../server
cp -r schemas ./../client/src

echo "Building enums..."
tsc