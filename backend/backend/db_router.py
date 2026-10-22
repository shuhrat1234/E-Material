import contextvars
from django.conf import settings

_current_branch = contextvars.ContextVar('current_branch', default='default')

def set_current_branch(branch):
    if branch in ('yashnobod', 'olmazor'):
        _current_branch.set(branch)
    else:
        _current_branch.set('default')

def get_current_branch():
    return _current_branch.get()

class BranchRouter:
    """
    Routes database operations to 'default' (Olmazor) or 'yashnobod'
    based on the current request branch.
    """
    def db_for_read(self, model, **hints):
        b = get_current_branch()
        if b == 'yashnobod' and 'yashnobod' in settings.DATABASES:
            return 'yashnobod'
        return 'default'

    def db_for_write(self, model, **hints):
        b = get_current_branch()
        if b == 'yashnobod' and 'yashnobod' in settings.DATABASES:
            return 'yashnobod'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True

class BranchMiddleware:
    """
    Sets the active database branch based on headers, query params, or referer.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        dept = (
            request.headers.get('x-department')
            or request.headers.get('x-branch')
            or request.GET.get('department')
            or request.GET.get('branch')
            or ''
        ).strip().lower()

        if not dept:
            referer = request.META.get('HTTP_REFERER', '').lower()
            if '/yashnobod' in referer:
                dept = 'yashnobod'
            elif '/olmazor' in referer:
                dept = 'olmazor'

        if dept == 'yashnobod':
            token = _current_branch.set('yashnobod')
        else:
            token = _current_branch.set('default')

        try:
            return self.get_response(request)
        finally:
            _current_branch.reset(token)
