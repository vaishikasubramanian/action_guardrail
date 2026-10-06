import yaml
from pathlib import Path


POLICY_FILE = Path("policy_rules.yaml")


def load_policies():
    """
    Load all policy rules from YAML file.
    """
    with open(POLICY_FILE, "r") as file:
        policies = yaml.safe_load(file)

    return policies["rules"]