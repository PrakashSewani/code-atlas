import git
import shutil
from pathlib import Path
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class RepoCloner:
    @staticmethod
    def clone_repository(repo_url: str, repo_name: str, progress_callback=None) -> Path:
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
                return target_dir

        logger.info(f"Cloning repository {repo_url} into {target_dir}...")
        try:
            # Using git.Repo.clone_from doesn't natively provide a simple progress callback for streams
            # We wrap the clone process. For true progress updates in SSE, 
            # we notify the callback that cloning has started.
            if progress_callback:
                progress_callback("cloning", {"status": "in_progress", "message": "Cloning repository..."})
            
            git.Repo.clone_from(repo_url, target_dir)
            
            if progress_callback:
                progress_callback("cloning", {"status": "completed", "message": "Repository cloned successfully"})
            
            return target_dir
        except Exception as e:
            if progress_callback:
                progress_callback("cloning", {"status": "error", "message": str(e)})
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
