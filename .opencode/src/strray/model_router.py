import os
import json
from typing import Dict, List, Optional, Any
from pathlib import Path

class ModelRouter:
    """Dynamic model routing service for StrRay agents."""

    def __init__(self, config_path: str = None):
        self.config_path = config_path or os.path.join(os.path.dirname(__file__), '..', '..', '..', 'oh-my-opencode.json')
        self.config = self._load_config()
        self.available_models = self._discover_models()

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration with model settings."""
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def _discover_models(self) -> List[str]:
        """Discover available models from configuration."""
        # Mock model discovery - in real implementation would query APIs
        return [
            "opencode/grok-code",
            "gpt-4o",
            "gpt-5.2",
            "google/gemini-3-pro-high",
            "google/gemini-3-flash"
        ]

    def get_validated_model(self, agent_type: str = None) -> str:
        """Get validated model using hierarchical selection."""
        # 1. User preference from OpenCode config
        user_model = self._get_user_preference()
        if user_model and self._is_model_available(user_model):
            return user_model

        # 2. Agent-specific model
        if agent_type:
            agent_model = self._get_agent_model(agent_type)
            if agent_model and self._is_model_available(agent_model):
                return agent_model

        # 3. Framework default
        default_model = self.config.get('model_default', 'opencode/grok-code')
        if self._is_model_available(default_model):
            return default_model

        # 4. Fallback
        fallback_model = self.config.get('model_fallback', 'opencode/grok-code')
        return fallback_model

    def _get_user_preference(self) -> Optional[str]:
        """Get user model preference from config hierarchy."""
        # Check ~/.config/opencode/opencode.json
        home_config = Path.home() / '.config' / 'opencode' / 'opencode.json'
        if home_config.exists():
            try:
                with open(home_config, 'r') as f:
                    data = json.load(f)
                    return data.get('model_default')
            except:
                pass

        # Check project .opencode/opencode.json
        project_config = Path(self.config_path).parent / 'opencode.json'
        if project_config.exists():
            try:
                with open(project_config, 'r') as f:
                    data = json.load(f)
                    return data.get('model_default')
            except:
                pass

        return None

    def _get_agent_model(self, agent_type: str) -> Optional[str]:
        """Get model specific to agent type."""
        agent_models = self.config.get('agent_models', {})

        # Map agent types to model keys
        model_mapping = {
            'librarian': 'librarian',
            'explore': 'explore',
            'frontend_ui_ux_engineer': 'ui_engineer',
            'document_writer': 'document_writer',
            'multimodal_looker': 'multimodal_looker'
        }

        model_key = model_mapping.get(agent_type)
        if model_key:
            return agent_models.get(f'{model_key}_model')

        return None

    def _is_model_available(self, model: str) -> bool:
        """Check if model is available and not deprecated."""
        if model in self.config.get('deprecated_models', []):
            return False

        return model in self.available_models

    def get_fallback_chain(self, start_model: str) -> List[str]:
        """Get fallback chain for a model."""
        chain = [start_model]

        # Add configured fallbacks
        fallback_chain = self.config.get('model_fallback_chain', [])
        for fallback in fallback_chain:
            if fallback not in chain and self._is_model_available(fallback):
                chain.append(fallback)

        # Add final fallback
        final_fallback = self.config.get('model_fallback', 'opencode/grok-code')
        if final_fallback not in chain:
            chain.append(final_fallback)

        return chain