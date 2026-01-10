# Test mode switching
echo 'Current mode:'
jq '.mode.current' oh-my-opencode.json
echo ''
echo 'Active agents in current mode:'
CURRENT_MODE=$(jq -r '.mode.current' oh-my-opencode.json)
jq ".mode.available_modes[\"$CURRENT_MODE\"].active_agents[]" oh-my-opencode.json
echo ''
echo 'Mode description:'
jq ".mode.available_modes[\"$CURRENT_MODE\"].description" oh-my-opencode.json
