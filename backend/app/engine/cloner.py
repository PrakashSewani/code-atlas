import git
import shutil
from pathlib import Path
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RepoCloner:
    @staticmethod
    def clone_repository(repo_url: str, repo_name: str) -> Path:
        """
        Clones a repository to the storage directory. 
        If it already exists, it pulls the latest changes.
        """
        target_dir = settings.REPOS_DIR / repo_name
        
        if target_dir.exists():
            logger.info(f"Repository {repo_name} already exists. Updating...")
            try:
                repo = git.Repo(target_dir)
                repo.remotes.origin.pull()
                return target_dir
            except Exception as e:
                logger.error(f"Failed to pull updates for {repo_name}: {e}")
                # If pull fails, we might want to re-clone, but for now we just log
                return target_dir

        logger.info(f"Cloning repository {repo_url} into {target_dir}...")
        try:
            git.Repo.clone_from(repo_url, target_dir)
            return target_dir
        except Exception as e:
            logger.error(f"Error cloning repository: {e}")
            raise e

    @staticmethod
    def clean_repository(repo_path: Path):
        """
        Remove unnecessary directories to save space and reduce noise.
        """
        ignore_list = [
            "node_modules", ".git", "dist", "build", "target", 
            "obj", "bin", "vendor", "__pycache__", ".next"
        ]
        
        for item in repo_path.rglob("*"):
            try:
                if item.is_dir() and item.name in ignore_list:
                    shutil.rmtree(item, ignore_errors=True)
                    logger.info(f"Cleaned: {item}")
            except Exception as e:
                logger.warning(f"Could not clean {item}: {e}")
