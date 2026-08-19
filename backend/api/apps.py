import os
import threading

from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import sys
        argv = sys.argv
        is_manage_py = len(argv) > 1 and argv[0].endswith('manage.py')
        command = argv[1] if is_manage_py else None

        if is_manage_py and command != 'runserver':
            # migrate/makemigrations/shell/seed_db/etc — nothing here serves
            # requests, so there's no reason to pull in the Silero model.
            return

        if is_manage_py and command == 'runserver' and '--noreload' not in argv:
            # The autoreloader re-imports every app twice: once in the watcher
            # parent process (no RUN_MAIN) and once in the actual serving child
            # (RUN_MAIN=true). Only preload in the child, or it loads twice.
            if os.environ.get('RUN_MAIN') != 'true':
                return

        from .silero_tts import preload
        threading.Thread(target=preload, daemon=True).start()
