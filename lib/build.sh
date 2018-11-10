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
echo "Building PartialEventObject..."
typescript-json-schema --refs --required index.d.ts global.PartialEventObject -o schemas/PartialEventObject.json
echo "Building AccountObject..."
typescript-json-schema --refs --required index.d.ts global.AccountObject -o schemas/AccountObject.json
echo "Building NewBlogPost..."
typescript-json-schema --refs --required index.d.ts global.NewBlogPost -o schemas/NewBlogPost.json
echo "Building NewEvent..."
typescript-json-schema --refs --required index.d.ts global.NewEventObject -o schemas/NewEventObject.json
echo "Building NewTeamObject..."
typescript-json-schema --refs --required index.d.ts global.NewTeamObject -o schemas/NewTeamObject.json
echo "Building TeamObject..."
typescript-json-schema --refs --required index.d.ts global.TeamObject -o schemas/TeamObject.json
echo "Building NewBlogPage..."
typescript-json-schema --refs --required index.d.ts global.NewBlogPage -o schemas/NewBlogPage.json
echo "Building BlogPage..."
typescript-json-schema --refs --required index.d.ts global.BlogPageObject -o schemas/BlogPageObject.json
echo "Building RegistryValues..."
typescript-json-schema --refs --required index.d.ts global.RegistryValues -o schemas/RegistryValues.json
echo "Building TeamMember..."
typescript-json-schema --refs --required index.d.ts global.TeamMember -o schemas/TeamMember.json
echo "Building NewTeamMember..."
typescript-json-schema --refs --required index.d.ts global.TeamMember -o schemas/NewTeamMember.json

cp -r schemas ./../server
cp -r schemas ./../client/src

echo "Building enums..."
tsc
