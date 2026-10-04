// Upgrade the legacy category shape without discarding subject settings on
// every local load, cloud snapshot or backup import.
export function migrateSubjects(rawSubjects) {
  const migrateNode = ({ categories, ...node }) => ({
    ...node,
    children: (node.children || categories || []).map(migrateNode),
  });
  return (rawSubjects || []).map(migrateNode);
}
